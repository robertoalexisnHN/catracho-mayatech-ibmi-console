import com.ibm.as400.access.AS400JDBCDriver;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Puente HTTP -> JDBC para IBM i, compatible con Java 8 + jt400-jdk8.
 * No contiene credenciales. Usa variables de entorno:
 * IBMI_HOST, IBMI_USER, IBMI_PASSWORD y opcionalmente BRIDGE_PORT.
 */
public class Bridge {
    private static final String HOST = env("IBMI_HOST", "");
    private static final String USER = env("IBMI_USER", "");
    private static final String PASSWORD = env("IBMI_PASSWORD", "");
    private static final int PORT = Integer.parseInt(env("BRIDGE_PORT", "8080"));
    private static final String ALLOW_ORIGIN = env("LARAVEL_ORIGIN", "*");

    public static void main(String[] args) throws Exception {
        if (HOST.isEmpty() || USER.isEmpty() || PASSWORD.isEmpty()) {
            System.err.println("Faltan IBMI_HOST, IBMI_USER o IBMI_PASSWORD.");
            System.exit(2);
        }

        DriverManager.registerDriver(new AS400JDBCDriver());

        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", PORT), 0);
        server.createContext("/api/health", Bridge::health);
        server.createContext("/api/objetos", Bridge::objects);
        server.createContext("/api/incidentes", Bridge::incidents);
        server.createContext("/api/cambios", Bridge::changes);
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        System.out.println("Catracho MayaTech IBM i Bridge escuchando en http://0.0.0.0:" + PORT);
    }

    private static Connection connect() throws SQLException {
        String url = "jdbc:as400://" + HOST + ";prompt=false;naming=sql;errors=full";
        return DriverManager.getConnection(url, USER, PASSWORD);
    }

    private static void health(HttpExchange ex) throws IOException {
        if (!onlyGet(ex)) return;
        try (Connection ignored = connect()) {
            json(ex, 200, "{\"ok\":true,\"bridge\":\"OK\",\"ibmi\":\"CONNECTED\"}");
        } catch (SQLException e) {
            json(ex, 503, "{\"ok\":false,\"bridge\":\"OK\",\"ibmi\":\"DISCONNECTED\",\"error\":\"" + esc(e.getMessage()) + "\"}");
        }
    }

    private static void objects(HttpExchange ex) throws IOException {
        if (!onlyGet(ex)) return;
        String library = query(ex, "biblioteca");
        if (!validLibrary(library)) {
            json(ex, 422, "{\"error\":\"biblioteca inválida\"}");
            return;
        }

        String sql = "SELECT OBJNAME, OBJTYPE, OBJLIB, OBJSIZE, OBJATTRIBUTE, CHANGE_TIMESTAMP, OBJTEXT " +
                "FROM TABLE(QSYS2.OBJECT_STATISTICS(?, '*ALL'))";
        run(ex, sql, library.toUpperCase());
    }

    private static void incidents(HttpExchange ex) throws IOException {
        if (!onlyGet(ex)) return;
        String sql = "SELECT MESSAGE_TIMESTAMP, MESSAGE_ID, MESSAGE_TEXT, SEVERITY " +
                "FROM TABLE(QSYS2.JOBLOG_INFO('*')) WHERE SEVERITY >= 30 " +
                "ORDER BY MESSAGE_TIMESTAMP DESC FETCH FIRST 100 ROWS ONLY";
        run(ex, sql);
    }

    private static void changes(HttpExchange ex) throws IOException {
        if (!onlyGet(ex)) return;
        String library = query(ex, "biblioteca");
        if (!validLibrary(library)) {
            json(ex, 422, "{\"error\":\"biblioteca inválida\"}");
            return;
        }

        String sql = "SELECT OBJNAME, OBJLIB, OBJTYPE, OBJATTRIBUTE, CHANGE_TIMESTAMP, OBJSIZE, OBJTEXT " +
                "FROM TABLE(QSYS2.OBJECT_STATISTICS(?, '*ALL')) " +
                "WHERE CHANGE_TIMESTAMP >= CURRENT_TIMESTAMP - 7 DAYS " +
                "ORDER BY CHANGE_TIMESTAMP DESC";
        run(ex, sql, library.toUpperCase());
    }

    private static void run(HttpExchange ex, String sql, String... params) throws IOException {
        try (Connection cn = connect(); PreparedStatement ps = cn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setString(i + 1, params[i]);
            try (ResultSet rs = ps.executeQuery()) {
                json(ex, 200, rowsToJson(rs));
            }
        } catch (SQLException e) {
            json(ex, 500, "{\"error\":\"" + esc(e.getMessage()) + "\"}");
        }
    }

    private static String rowsToJson(ResultSet rs) throws SQLException {
        ResultSetMetaData md = rs.getMetaData();
        int cols = md.getColumnCount();
        StringBuilder out = new StringBuilder("{\"data\":[");
        boolean firstRow = true;
        while (rs.next()) {
            if (!firstRow) out.append(',');
            firstRow = false;
            out.append('{');
            for (int i = 1; i <= cols; i++) {
                if (i > 1) out.append(',');
                String key = md.getColumnLabel(i);
                Object value = rs.getObject(i);
                out.append('"').append(esc(key)).append("\":");
                if (value == null) out.append("null");
                else if (value instanceof Number || value instanceof Boolean) out.append(value.toString());
                else out.append('"').append(esc(String.valueOf(value))).append('"');
            }
            out.append('}');
        }
        return out.append("]}").toString();
    }

    private static boolean onlyGet(HttpExchange ex) throws IOException {
        cors(ex);
        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            return false;
        }
        if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
            json(ex, 405, "{\"error\":\"Método no permitido\"}");
            return false;
        }
        return true;
    }

    private static void cors(HttpExchange ex) {
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void json(HttpExchange ex, int status, String body) throws IOException {
        cors(ex);
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    private static String query(HttpExchange ex, String key) throws IOException {
        String raw = ex.getRequestURI().getRawQuery();
        if (raw == null) return "";
        for (String pair : raw.split("&")) {
            String[] kv = pair.split("=", 2);
            String k = URLDecoder.decode(kv[0], "UTF-8");
            if (key.equals(k)) return kv.length > 1 ? URLDecoder.decode(kv[1], "UTF-8") : "";
        }
        return "";
    }

    private static boolean validLibrary(String value) {
        return value != null && value.toUpperCase().matches("[A-Z0-9_$#@]{1,10}");
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }
}

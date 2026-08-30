# IBM i Java Bridge

Este puente corre en la laptop que sí tiene VPN hacia la LPAR. Requiere Java 8 y `jt400-jdk8-11.1.jar`.

## Variables de entorno en CMD

```cmd
set IBMI_HOST=10.x.x.x
set IBMI_USER=USUARIO_PRUEBAS
set IBMI_PASSWORD=CONTRASENA
set BRIDGE_PORT=8080
```

No subas estas variables ni credenciales al repositorio.

## Compilar

Si el JAR está en la misma carpeta:

```cmd
javac -cp jt400-jdk8-11.1.jar Bridge.java
```

## Ejecutar

```cmd
java -cp .;jt400-jdk8-11.1.jar Bridge
```

Prueba primero:

```text
http://localhost:8080/api/health
```

Desde la PC personal configura en Laravel:

```env
IBMI_BRIDGE_URL=http://IP_LOCAL_LAPTOP_TRABAJO:8080
IBMI_DEMO_MODE=false
```

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PassPackage;
use App\Services\IbmiBridgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class PassController extends Controller
{
    public function __construct(private readonly IbmiBridgeService $bridge) {}

    public function parseList(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['nullable', 'file', 'max:5120', 'mimes:txt,csv,xlsx,xls'],
            'text' => ['nullable', 'string'],
        ]);

        abort_if(!$request->hasFile('file') && blank($request->input('text')), 422, 'Carga un archivo o pega una lista.');

        $rows = $request->hasFile('file')
            ? $this->rowsFromFile($request->file('file')->getRealPath(), strtolower($request->file('file')->getClientOriginalExtension()))
            : preg_split('/\R/', (string) $request->input('text'));

        $objects = collect($rows)
            ->flatMap(fn ($row) => $this->normalizeRow($row))
            ->filter(fn ($o) => filled($o['name'] ?? null))
            ->unique('name')
            ->values();

        return response()->json(['count' => $objects->count(), 'objects' => $objects]);
    }

    public function validatePass(Request $request): JsonResponse
    {
        $data = $request->validate([
            'origin' => ['required', 'in:DEV,QA'],
            'destination' => ['required', 'in:QA,PROD'],
            'objects' => ['required', 'array', 'min:1'],
            'objects.*' => ['required', 'string', 'max:128'],
        ]);
        abort_if($data['origin'] === $data['destination'], 422, 'Origen y destino no pueden ser iguales.');

        $comparison = $this->bridge->compare($data['objects'], $data['origin'], $data['destination']);
        $ordered = $this->compileOrder($comparison);
        $summary = $this->summary($ordered);

        return response()->json(['comparison' => $ordered, 'summary' => $summary]);
    }

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'origin' => ['required', 'in:DEV,QA'],
            'destination' => ['required', 'in:QA,PROD'],
            'operator' => ['nullable', 'string', 'max:120'],
            'objects' => ['required', 'array', 'min:1'],
            'objects.*' => ['required', 'string', 'max:128'],
        ]);

        $comparison = $this->compileOrder($this->bridge->compare($data['objects'], $data['origin'], $data['destination']));
        $summary = $this->summary($comparison);
        $code = 'PASS-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);

        $package = DB::transaction(function () use ($data, $comparison, $summary, $code) {
            $package = PassPackage::create([
                'code' => $code,
                'origin' => $data['origin'],
                'destination' => $data['destination'],
                'operator' => $data['operator'] ?? 'OPERADOR',
                'risk' => $summary['risk'],
                'status' => 'preparado',
                'summary' => $summary,
            ]);

            foreach ($comparison as $index => $obj) {
                $package->objects()->create([
                    'name' => $obj['name'],
                    'object_type' => $obj['type'] ?? null,
                    'library' => $obj['library'] ?? null,
                    'status' => $obj['status'] ?? 'diff',
                    'risk' => $obj['risk'] ?? 'medio',
                    'compile_order' => $index + 1,
                    'metadata' => ['origin' => $obj['origin'] ?? null, 'destination' => $obj['destination'] ?? null],
                    'dependencies' => $obj['dependencies'] ?? [],
                ]);
            }

            return $package->load('objects');
        });

        return response()->json(['message' => 'Paquete de pase generado.', 'package' => $package], 201);
    }

    public function show(PassPackage $passPackage): JsonResponse
    {
        return response()->json($passPackage->load('objects'));
    }

    private function rowsFromFile(string $path, string $ext): array
    {
        if (in_array($ext, ['xlsx', 'xls'], true)) {
            $sheet = IOFactory::load($path)->getActiveSheet();
            return $sheet->toArray(null, true, true, false);
        }

        return file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    }

    private function normalizeRow(mixed $row): array
    {
        if (is_array($row)) {
            $cells = array_values(array_filter(array_map(fn ($v) => trim((string) $v), $row), fn ($v) => $v !== ''));
            if (!$cells) return [];
            if (in_array(strtoupper($cells[0]), ['OBJETO', 'OBJECT', 'OBJNAME', 'NOMBRE'], true)) return [];
            return [[
                'name' => strtoupper($cells[0]),
                'type' => $cells[1] ?? null,
                'library' => $cells[2] ?? null,
            ]];
        }

        $line = trim((string) $row);
        if ($line === '') return [];
        $parts = preg_split('/[\s,;|\t]+/', $line) ?: [];
        if (in_array(strtoupper($parts[0] ?? ''), ['OBJETO', 'OBJECT', 'OBJNAME', 'NOMBRE'], true)) return [];

        return [[
            'name' => strtoupper($parts[0] ?? ''),
            'type' => $parts[1] ?? null,
            'library' => $parts[2] ?? null,
        ]];
    }

    private function compileOrder(array $objects): array
    {
        $byName = collect($objects)->keyBy('name');
        $visited = [];
        $out = [];

        $visit = function (array $obj) use (&$visit, &$visited, &$out, $byName): void {
            $name = $obj['name'];
            if (isset($visited[$name])) return;
            $visited[$name] = true;
            foreach ($obj['dependencies'] ?? [] as $dep) {
                if ($byName->has($dep)) $visit($byName->get($dep));
            }
            $out[] = $obj;
        };

        collect($objects)
            ->sortByDesc(fn ($o) => str_contains((string) ($o['type'] ?? ''), 'FILE'))
            ->each(fn ($obj) => $visit($obj));

        return array_values($out);
    }

    private function summary(array $objects): array
    {
        $c = collect($objects);
        $missing = $c->where('status', 'missing')->count() + $c->where('status', 'missing_source')->count();
        $diff = $c->where('status', 'diff')->count();
        $sync = $c->where('status', 'sync')->count();
        $dependencies = $c->flatMap(fn ($o) => $o['dependencies'] ?? [])->unique();
        $names = $c->pluck('name');
        $missingDeps = $dependencies->diff($names)->count();
        $risk = ($missing > 0 || $missingDeps > 0) ? 'alto' : ($diff > 0 ? 'medio' : 'bajo');

        return [
            'requested' => $c->count(),
            'sync' => $sync,
            'to_update' => $diff,
            'missing' => $missing,
            'missing_dependencies' => $missingDeps,
            'risk' => $risk,
        ];
    }
}

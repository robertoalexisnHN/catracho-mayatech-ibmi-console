<?php

namespace App\Services;

use App\Support\DemoData;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class IbmiBridgeService
{
    public function health(): array
    {
        try {
            $response = Http::timeout(config('ibmi.timeout'))->get($this->url('/api/health'));
            if ($response->successful()) {
                $payload = $response->json();
                return ['source' => 'bridge', ...(is_array($payload) ? $payload : [])];
            }
        } catch (ConnectionException) {
            // fallback debajo
        }

        if (config('ibmi.demo_mode')) {
            return ['source' => 'demo', 'bridge' => 'OFFLINE', 'ibmi' => 'DEMO', 'ok' => true];
        }

        throw new RuntimeException('El puente Java IBM i no está disponible.');
    }

    public function objects(string $environment, ?string $library = null): array
    {
        $library ??= config("ibmi.libraries.$environment");

        try {
            $response = Http::timeout(config('ibmi.timeout'))
                ->acceptJson()
                ->get($this->url('/api/objetos'), ['biblioteca' => $library]);

            if ($response->successful()) {
                $payload = $response->json();
                return is_array($payload) ? ($payload['data'] ?? $payload) : [];
            }
        } catch (ConnectionException) {
            // fallback debajo
        }

        if (!config('ibmi.demo_mode')) {
            throw new RuntimeException("No se pudieron consultar objetos de $environment ($library).");
        }

        return $this->demoObjectsFor($environment);
    }

    public function incidents(): array
    {
        try {
            $response = Http::timeout(config('ibmi.timeout'))->acceptJson()->get($this->url('/api/incidentes'));
            if ($response->successful()) {
                $payload = $response->json();
                return is_array($payload) ? ($payload['data'] ?? $payload) : [];
            }
        } catch (ConnectionException) {
            // fallback debajo
        }

        return config('ibmi.demo_mode') ? DemoData::incidents() : [];
    }

    public function changes(string $environment = 'PROD', ?string $library = null): array
    {
        $library ??= config("ibmi.libraries.$environment");

        try {
            $response = Http::timeout(config('ibmi.timeout'))->acceptJson()->get($this->url('/api/cambios'), ['biblioteca' => $library]);
            if ($response->successful()) {
                $payload = $response->json();
                return is_array($payload) ? ($payload['data'] ?? $payload) : [];
            }
        } catch (ConnectionException) {
            // fallback debajo
        }

        if (!config('ibmi.demo_mode')) return [];

        return array_values(array_map(fn (array $o) => [
            'OBJNAME' => $o['name'],
            'OBJLIB' => $o['library'],
            'CHANGE_TIMESTAMP' => $o['versions'][$environment]['changed'] ?? null,
        ], DemoData::objects()));
    }

    public function compare(array $names, string $origin, string $destination): array
    {
        if (config('ibmi.demo_mode')) {
            $catalog = collect(DemoData::objects())->keyBy('name');
            return collect($names)->map(function ($name) use ($catalog, $origin, $destination) {
                $obj = $catalog->get(strtoupper($name));
                if (!$obj) {
                    return ['name' => strtoupper($name), 'status' => 'missing_source', 'risk' => 'alto'];
                }
                $from = $obj['versions'][$origin] ?? ['present' => false];
                $to = $obj['versions'][$destination] ?? ['present' => false];
                $status = !$to['present'] ? 'missing' : (($from['rev'] ?? null) === ($to['rev'] ?? null) ? 'sync' : 'diff');
                return [
                    'name' => $obj['name'],
                    'type' => $obj['type'],
                    'library' => $obj['library'],
                    'description' => $obj['description'],
                    'dependencies' => $obj['deps'],
                    'origin' => $from,
                    'destination' => $to,
                    'status' => $status,
                    'risk' => $status === 'missing' ? 'alto' : ($status === 'diff' ? 'medio' : 'bajo'),
                ];
            })->values()->all();
        }

        $originRows = collect($this->objects($origin))->mapWithKeys(fn ($row) => [strtoupper((string) $this->value($row, ['OBJNAME', 'objname', 'name'])) => $row]);
        $destRows = collect($this->objects($destination))->mapWithKeys(fn ($row) => [strtoupper((string) $this->value($row, ['OBJNAME', 'objname', 'name'])) => $row]);

        return collect($names)->map(function ($rawName) use ($originRows, $destRows) {
            $name = strtoupper($rawName);
            $from = $originRows->get($name);
            $to = $destRows->get($name);
            if (!$from) return ['name' => $name, 'status' => 'missing_source', 'risk' => 'alto'];
            if (!$to) return ['name' => $name, 'status' => 'missing', 'risk' => 'alto', 'origin' => $from, 'destination' => null];

            $changedFrom = $this->value($from, ['CHANGE_TIMESTAMP', 'change_timestamp', 'changed']);
            $changedTo = $this->value($to, ['CHANGE_TIMESTAMP', 'change_timestamp', 'changed']);
            $sizeFrom = $this->value($from, ['OBJSIZE', 'objsize', 'size']);
            $sizeTo = $this->value($to, ['OBJSIZE', 'objsize', 'size']);
            $ownerFrom = $this->value($from, ['OWNER', 'OBJOWNER', 'owner']);
            $ownerTo = $this->value($to, ['OWNER', 'OBJOWNER', 'owner']);
            $same = $changedFrom === $changedTo && $sizeFrom === $sizeTo && $ownerFrom === $ownerTo;

            return [
                'name' => $name,
                'type' => $this->value($from, ['OBJTYPE', 'objtype', 'type']),
                'library' => $this->value($from, ['OBJLIB', 'objlib', 'library']),
                'origin' => $from,
                'destination' => $to,
                'status' => $same ? 'sync' : 'diff',
                'risk' => $same ? 'bajo' : 'medio',
                'dependencies' => [],
            ];
        })->values()->all();
    }

    private function demoObjectsFor(string $environment): array
    {
        return array_map(function (array $obj) use ($environment) {
            $v = $obj['versions'][$environment] ?? ['present' => false];
            return [
                'OBJNAME' => $obj['name'],
                'OBJTYPE' => str_contains($obj['type'], '*FILE') ? '*FILE' : '*PGM',
                'OBJLIB' => $obj['library'],
                'OBJSIZE' => $v['size'] ?? null,
                'OBJATTRIBUTE' => $v['attribute'] ?? null,
                'CHANGE_TIMESTAMP' => $v['changed'] ?? null,
                'OBJTEXT' => $obj['description'],
                'OWNER' => $v['owner'] ?? null,
                'PRESENT' => $v['present'] ?? false,
            ];
        }, DemoData::objects());
    }

    private function url(string $path): string
    {
        return rtrim((string) config('ibmi.bridge_url'), '/').$path;
    }

    private function value(array $row, array $keys): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row)) return $row[$key];
        }
        return null;
    }
    public function systemHealth(): array
{
    try {
        $response = Http::timeout((int) config('ibmi.timeout', 8))
            ->acceptJson()
            ->get($this->url('/api/sistema'));

        if ($response->successful()) {
            $payload = $response->json();

            if (is_array($payload)) {
                return [
                    'source' => 'bridge',
                    'connected' => true,
                    ...$payload,
                ];
            }
        }
    } catch (\Throwable $e) {
        // Si la VPN o IBM i se cae, seguimos al manejo de desconexión.
    }

    if (config('ibmi.demo_mode')) {
        return [
            'source' => 'demo',
            'connected' => false,
            'system' => 'PROD',

            'subsystems' => [
                'active' => 0,
                'total' => 0,
            ],

            'jobsQueued' => 0,
            'aspUsed' => null,
            'cpuAvg' => null,
            'cpuAvailable' => false,

            'operator' => [
                'user' => 'DEMO',
                'userClass' => '*USER',
            ],

            'timestamp' => null,
        ];
    }

    throw new RuntimeException(
        'No se pudo consultar la salud del IBM i mediante el Bridge.'
    );
}
}

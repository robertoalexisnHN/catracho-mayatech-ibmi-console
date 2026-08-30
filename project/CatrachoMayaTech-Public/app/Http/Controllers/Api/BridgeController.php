<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IbmiBridgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class BridgeController extends Controller
{
    public function __construct(private readonly IbmiBridgeService $bridge) {}

    public function health(): JsonResponse
    {
        try {
            return response()->json($this->bridge->health());
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 503);
        }
    }
    public function systemHealth(): JsonResponse
{
    try {
        return response()->json(
            $this->bridge->systemHealth()
        );
    } catch (Throwable $e) {
        return response()->json([
            'ok' => false,
            'connected' => false,
            'message' => $e->getMessage(),
        ], 503);
    }
}

    public function objects(Request $request): JsonResponse
    {
        $env = strtoupper((string) $request->query('environment', 'DEV'));
        abort_unless(in_array($env, ['DEV', 'QA', 'PROD'], true), 422, 'Ambiente inválido.');
        return response()->json(['environment' => $env, 'data' => $this->bridge->objects($env, $request->query('library'))]);
    }

    public function incidents(): JsonResponse
    {
        return response()->json(['data' => $this->bridge->incidents()]);
    }

    public function changes(Request $request): JsonResponse
    {
        $env = strtoupper((string) $request->query('environment', 'PROD'));
        abort_unless(in_array($env, ['DEV', 'QA', 'PROD'], true), 422, 'Ambiente inválido.');
        return response()->json(['environment' => $env, 'data' => $this->bridge->changes($env, $request->query('library'))]);
    }
}

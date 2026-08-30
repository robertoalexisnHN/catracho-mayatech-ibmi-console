<?php

use App\Http\Controllers\Api\BridgeController;
use App\Http\Controllers\Api\PassController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [BridgeController::class, 'health']);
Route::get('/system-health', [BridgeController::class, 'systemHealth']);
Route::get('/objects', [BridgeController::class, 'objects']);
Route::get('/incidents', [BridgeController::class, 'incidents']);
Route::get('/changes', [BridgeController::class, 'changes']);

Route::post('/passes/parse-list', [PassController::class, 'parseList']);
Route::post('/passes/validate', [PassController::class, 'validatePass']);
Route::post('/passes/generate', [PassController::class, 'generate']);
Route::get('/passes/{passPackage}', [PassController::class, 'show']);
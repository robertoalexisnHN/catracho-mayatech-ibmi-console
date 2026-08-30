<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PassApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_works_in_demo_mode(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('ok', true);
    }

    public function test_can_validate_demo_pass(): void
    {
        $this->postJson('/api/passes/validate', [
            'origin' => 'DEV',
            'destination' => 'PROD',
            'objects' => ['ORDVAL01', 'PCTLOOKUP', 'ORDHDR'],
        ])->assertOk()->assertJsonPath('summary.risk', 'alto');
    }
}

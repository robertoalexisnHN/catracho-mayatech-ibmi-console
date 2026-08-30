<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('catracho:status', function () {
    $this->info('Catracho MayaTech · Consola IBM i');
    $this->line('Bridge URL: '.config('ibmi.bridge_url'));
    $this->line('Modo demo: '.(config('ibmi.demo_mode') ? 'SI' : 'NO'));
})->purpose('Muestra el estado básico de configuración del proyecto');

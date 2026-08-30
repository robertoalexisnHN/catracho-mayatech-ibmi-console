<?php

return [
    'bridge_url' => env('IBMI_BRIDGE_URL', 'http://127.0.0.1:8080'),
    'timeout' => (int) env('IBMI_BRIDGE_TIMEOUT', 8),
    'demo_mode' => filter_var(env('IBMI_DEMO_MODE', true), FILTER_VALIDATE_BOOL),
    'libraries' => [
        'DEV' => env('IBMI_LIBRARY_DEV', 'MIAPPDEV'),
        'QA' => env('IBMI_LIBRARY_QA', 'MIAPPQA'),
        'PROD' => env('IBMI_LIBRARY_PROD', 'MIAPPPRD'),
    ],
];

<?php

namespace App\Support;

class DemoData
{
    public static function objects(): array
    {
        return [
            [
                'name' => 'ORDVAL01', 'type' => '*PGM (RPGLE)', 'library' => 'APPLIB', 'description' => 'Validación y cálculo de descuento de órdenes de venta', 'deps' => ['PCTLOOKUP', 'ORDHDR', 'CUSTMAST'],
                'versions' => [
                    'DEV' => ['rev' => 'r418', 'size' => '184.2 KB', 'changed' => '2026-08-27 16:44', 'present' => true, 'attribute' => 'RPGLE', 'created' => '2024-03-11 10:02', 'compiled' => '2026-08-27 16:44', 'owner' => 'R.MARTÍNEZ'],
                    'QA' => ['rev' => 'r418', 'size' => '184.2 KB', 'changed' => '2026-08-27 16:44', 'present' => true, 'attribute' => 'RPGLE', 'created' => '2024-03-11 10:02', 'compiled' => '2026-08-27 16:44', 'owner' => 'R.MARTÍNEZ'],
                    'PROD' => ['rev' => 'r402', 'size' => '179.8 KB', 'changed' => '2026-08-14 09:10', 'present' => true, 'attribute' => 'RPGLE', 'created' => '2024-03-11 10:02', 'compiled' => '2026-08-14 09:10', 'owner' => 'A.CÁCERES'],
                ],
            ],
            [
                'name' => 'PCTLOOKUP', 'type' => '*PGM (RPGLE)', 'library' => 'APPLIB', 'description' => 'Lookup de porcentaje de descuento desde tabla PCT', 'deps' => [],
                'versions' => [
                    'DEV' => ['rev' => 'r51', 'size' => '42.1 KB', 'changed' => '2026-08-27 16:40', 'present' => true, 'attribute' => 'RPGLE', 'created' => '2026-08-27 16:40', 'compiled' => '2026-08-27 16:40', 'owner' => 'R.MARTÍNEZ'],
                    'QA' => ['rev' => 'r51', 'size' => '42.1 KB', 'changed' => '2026-08-27 16:40', 'present' => true, 'attribute' => 'RPGLE', 'created' => '2026-08-27 16:40', 'compiled' => '2026-08-27 16:40', 'owner' => 'R.MARTÍNEZ'],
                    'PROD' => ['rev' => '—', 'size' => '—', 'changed' => '—', 'present' => false, 'attribute' => null, 'created' => null, 'compiled' => null, 'owner' => null],
                ],
            ],
            [
                'name' => 'ORDHDR', 'type' => '*FILE (PF)', 'library' => 'APPLIB', 'description' => 'Cabecera de órdenes de venta (physical file)', 'deps' => [],
                'versions' => [
                    'DEV' => ['rev' => 'r12', 'size' => '3.4 MB', 'changed' => '2026-08-20 11:02', 'present' => true, 'attribute' => 'PF', 'created' => '2023-01-08 08:00', 'compiled' => '2026-08-20 11:02', 'owner' => 'R.MARTÍNEZ'],
                    'QA' => ['rev' => 'r12', 'size' => '3.4 MB', 'changed' => '2026-08-20 11:02', 'present' => true, 'attribute' => 'PF', 'created' => '2023-01-08 08:00', 'compiled' => '2026-08-20 11:02', 'owner' => 'R.MARTÍNEZ'],
                    'PROD' => ['rev' => 'r11', 'size' => '3.3 MB', 'changed' => '2026-07-30 08:00', 'present' => true, 'attribute' => 'PF', 'created' => '2023-01-08 08:00', 'compiled' => '2026-07-30 08:00', 'owner' => 'A.CÁCERES'],
                ],
            ],
            [
                'name' => 'CUSTMAST', 'type' => '*FILE (PF)', 'library' => 'APPLIB', 'description' => 'Maestro de clientes (physical file)', 'deps' => [],
                'versions' => [
                    'DEV' => ['rev' => 'r7', 'size' => '12.8 MB', 'changed' => '2026-06-02 09:31', 'present' => true, 'attribute' => 'PF', 'created' => '2022-05-19 07:45', 'compiled' => '2026-06-02 09:31', 'owner' => 'A.CÁCERES'],
                    'QA' => ['rev' => 'r7', 'size' => '12.8 MB', 'changed' => '2026-06-02 09:31', 'present' => true, 'attribute' => 'PF', 'created' => '2022-05-19 07:45', 'compiled' => '2026-06-02 09:31', 'owner' => 'A.CÁCERES'],
                    'PROD' => ['rev' => 'r7', 'size' => '12.8 MB', 'changed' => '2026-06-02 09:31', 'present' => true, 'attribute' => 'PF', 'created' => '2022-05-19 07:45', 'compiled' => '2026-06-02 09:31', 'owner' => 'A.CÁCERES'],
                ],
            ],
            [
                'name' => 'INVRPT02', 'type' => '*PGM (CLLE)', 'library' => 'RPTLIB', 'description' => 'Reporte de inventario (programa CL)', 'deps' => ['CUSTMAST'],
                'versions' => [
                    'DEV' => ['rev' => 'r33', 'size' => '28.7 KB', 'changed' => '2026-05-18 14:20', 'present' => true, 'attribute' => 'CLLE', 'created' => '2023-09-02 12:00', 'compiled' => '2026-05-18 14:20', 'owner' => 'A.CÁCERES'],
                    'QA' => ['rev' => 'r33', 'size' => '28.7 KB', 'changed' => '2026-05-18 14:20', 'present' => true, 'attribute' => 'CLLE', 'created' => '2023-09-02 12:00', 'compiled' => '2026-05-18 14:20', 'owner' => 'A.CÁCERES'],
                    'PROD' => ['rev' => 'r33', 'size' => '28.7 KB', 'changed' => '2026-05-18 14:20', 'present' => true, 'attribute' => 'CLLE', 'created' => '2023-09-02 12:00', 'compiled' => '2026-05-18 14:20', 'owner' => 'A.CÁCERES'],
                ],
            ],
        ];
    }

    public static function incidents(): array
    {
        return [
            [
                'id' => 'INC-4471', 'title' => 'ORDVAL01 termina con excepción no controlada al calcular descuento', 'severity' => 'critica', 'env' => 'PROD', 'timestamp' => '2026-08-29 03:14:07', 'msgId' => 'MCH3401', 'status' => 'activo',
                'translation' => 'El programa de validación de órdenes se detuvo porque intentó llamar al programa PCTLOOKUP, que no está instalado en PROD.',
            ],
            [
                'id' => 'INC-4468', 'title' => 'Cola de salida QPRINT con crecimiento anómalo en PROD', 'severity' => 'media', 'env' => 'PROD', 'timestamp' => '2026-08-29 01:52:40', 'msgId' => 'CPF3309', 'status' => 'en revisión',
                'translation' => 'Se acumulan casi 1.900 reportes en espera de impresión sin un dispositivo activo.',
            ],
            [
                'id' => 'INC-4455', 'title' => 'Tiempo de respuesta elevado en subsistema QINTER', 'severity' => 'baja', 'env' => 'QA', 'timestamp' => '2026-08-28 18:07:11', 'msgId' => 'CPF1124', 'status' => 'resuelto',
                'translation' => 'Las sesiones 5250 interactivas en QA respondieron más lento de lo normal por un pico de carga batch simultáneo.',
            ],
        ];
    }
}

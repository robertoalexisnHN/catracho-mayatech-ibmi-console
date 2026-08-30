<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title>Catracho MayaTech · Consola IBM i</title>
    <meta name="description" content="Consola de Continuidad Operativa IBM i - Catracho MayaTech">
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')('resources/js/main.tsx'); ?>
</head>
<body>
    <div id="root"></div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\CatrachoMayaTech-Laravel\CatrachoMayaTech-Laravel\resources\views/app.blade.php ENDPATH**/ ?>
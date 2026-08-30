<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pass_packages', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('origin', 10);
            $table->string('destination', 10);
            $table->string('operator')->nullable();
            $table->string('risk', 10)->default('bajo');
            $table->string('status', 20)->default('preparado');
            $table->json('summary')->nullable();
            $table->timestamps();
        });

        Schema::create('pass_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pass_package_id')->constrained()->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('object_type', 64)->nullable();
            $table->string('library', 128)->nullable();
            $table->string('status', 32);
            $table->string('risk', 10)->default('bajo');
            $table->unsignedInteger('compile_order')->default(0);
            $table->json('metadata')->nullable();
            $table->json('dependencies')->nullable();
            $table->timestamps();
            $table->index(['name', 'library']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pass_objects');
        Schema::dropIfExists('pass_packages');
    }
};

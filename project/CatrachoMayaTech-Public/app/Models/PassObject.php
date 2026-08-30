<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PassObject extends Model
{
    protected $fillable = [
        'name', 'object_type', 'library', 'status', 'risk', 'compile_order', 'metadata', 'dependencies',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array', 'dependencies' => 'array'];
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(PassPackage::class, 'pass_package_id');
    }
}

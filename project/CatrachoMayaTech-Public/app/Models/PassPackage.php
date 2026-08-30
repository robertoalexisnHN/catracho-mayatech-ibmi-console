<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PassPackage extends Model
{
    protected $fillable = [
        'code', 'origin', 'destination', 'operator', 'risk', 'status', 'summary',
    ];

    protected function casts(): array
    {
        return ['summary' => 'array'];
    }

    public function objects(): HasMany
    {
        return $this->hasMany(PassObject::class);
    }
}

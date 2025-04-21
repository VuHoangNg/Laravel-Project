<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->foreignId('thumbnail_id')
                  ->nullable()
                  ->constrained('media')
                  ->onDelete('set null')
                  ->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropForeign(['thumbnail_id']);
            $table->dropColumn('thumbnail_id');
        });
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->foreignId('thumbnail_id')
                ->nullable()
                ->constrained('media1') // Ensures correct reference to media1 table
                ->onDelete('set null')
                ->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropForeign(['thumbnail_id']); // Drop foreign key first
            $table->dropColumn('thumbnail_id'); // Then remove the column
        });
    }
};
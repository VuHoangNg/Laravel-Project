<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('path');
            $table->string('thumbnail_path')->nullable();
            $table->integer('status')->default(0); // 0 = processing, 1 = success, -1 = fail
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('media'); // Fixed table name here
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTypeColumnToMedia1Table extends Migration
{
    public function up()
    {
        Schema::table('media1', function (Blueprint $table) {
            $table->string('type')->nullable()->after('title');
        });
    }

    public function down()
    {
        Schema::table('media1', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
}
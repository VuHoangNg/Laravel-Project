<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDurationToMedia1Table extends Migration
{
    public function up()
    {
        Schema::table('media1', function (Blueprint $table) {
            $table->float('duration')->nullable()->after('status');
        });
    }

    public function down()
    {
        Schema::table('media1', function (Blueprint $table) {
            $table->dropColumn('duration');
        });
    }
}

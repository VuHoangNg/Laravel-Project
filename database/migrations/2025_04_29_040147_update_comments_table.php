<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('comments', function (Blueprint $table) {
            // Rename columns if needed
            $table->renameColumn('users_id', 'user_id');
            // Ensure foreign keys are correctly set
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('media1_id')->references('id')->on('media1')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('comments', function (Blueprint $table) {
            // Rollback changes if necessary
            $table->dropForeign(['user_id']);
            $table->dropForeign(['media1_id']);
            $table->renameColumn('user_id', 'users_id');
        });
    }
};

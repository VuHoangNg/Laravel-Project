<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterNotificationsTableMakeCommentIdNullable extends Migration
{
    public function up()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('comment_id')->nullable()->change();
            // Update the foreign key constraint to allow NULL
            $table->foreign('comment_id')->references('id')->on('comments')->onDelete('set null')->change();
        });
    }

    public function down()
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Note: This rollback assumes the original state was NOT NULL
            $table->dropForeign(['comment_id']);
            $table->unsignedBigInteger('comment_id')->change();
            $table->foreign('comment_id')->references('id')->on('comments')->onDelete('cascade')->change();
        });
    }
}
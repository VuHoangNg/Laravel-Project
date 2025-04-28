<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBlogIdToMedia1Table extends Migration
{
    public function up()
    {
        Schema::table('media1', function (Blueprint $table) {
            $table->foreignId('blog_id')->nullable()->constrained('blogs')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('media1', function (Blueprint $table) {
            $table->dropForeign(['blog_id']);
            $table->dropColumn('blog_id');
        });
    }
}
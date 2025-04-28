<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateMediaToManyToManyWithBlogs extends Migration
{
    public function up()
    {
        // Create blog_media pivot table
        Schema::create('blog_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_id')->constrained('blogs')->onDelete('cascade');
            $table->foreignId('media_id')->constrained('media1')->onDelete('cascade');
            $table->timestamps();
        });

        // Remove blog_id from media1
        Schema::table('media1', function (Blueprint $table) {
            $table->dropForeign(['blog_id']);
            $table->dropColumn('blog_id');
        });
    }

    public function down()
    {
        // Drop blog_media table
        Schema::dropIfExists('blog_media');

        // Restore blog_id in media1
        Schema::table('media1', function (Blueprint $table) {
            $table->foreignId('blog_id')->nullable()->constrained('blogs')->onDelete('set null');
        });
    }
}
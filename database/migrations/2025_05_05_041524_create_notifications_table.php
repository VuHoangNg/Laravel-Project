<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // User receiving the notification
            $table->unsignedBigInteger('triggered_by_id'); // User who triggered the notification
            $table->unsignedBigInteger('media1_id'); // Media associated with the notification
            $table->unsignedBigInteger('comment_id'); // Comment associated with the notification
            $table->string('type'); // e.g., 'reply' or 'media_comment'
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('triggered_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('media1_id')->references('id')->on('media1')->onDelete('cascade');
            $table->foreign('comment_id')->references('id')->on('comments')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
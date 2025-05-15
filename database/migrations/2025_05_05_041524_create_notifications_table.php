<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('triggered_by_id');
            $table->unsignedBigInteger('media1_id');
            $table->unsignedBigInteger('comment_id'); // Likely NOT NULL here
            $table->unsignedBigInteger('script_id')->nullable();
            $table->unsignedBigInteger('feedback_id')->nullable();
            $table->string('type');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('triggered_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('media1_id')->references('id')->on('media')->onDelete('cascade');
            $table->foreign('comment_id')->references('id')->on('comments')->onDelete('cascade');
            $table->foreign('script_id')->references('id')->on('scripts')->onDelete('set null');
            $table->foreign('feedback_id')->references('id')->on('feedbacks')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}
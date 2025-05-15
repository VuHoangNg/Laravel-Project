<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddScriptFeedbackColumnsToNotificationsTable extends Migration
{
    public function up()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('script_id')->nullable()->constrained('scripts')->onDelete('cascade');
            $table->foreignId('feedback_id')->nullable()->constrained('feedbacks')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['script_id']);
            $table->dropForeign(['feedback_id']);
            $table->dropColumn(['script_id', 'feedback_id']);
        });
    }
}
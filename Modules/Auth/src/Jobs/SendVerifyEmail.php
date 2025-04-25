<?php

namespace Modules\Auth\src\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Mail\VerifyEmail;
use Illuminate\Support\Facades\Mail;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Log;

class SendVerifyEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;
    protected $verificationUrl;

    public $tries = 3;
    public $backoff = 60;

    public function __construct(User $user, string $verificationUrl)
    {
        $this->user = $user;
        $this->verificationUrl = $verificationUrl;
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        try {
            Mail::to($this->user->email)->send(new VerifyEmail($this->user, $this->verificationUrl));
            Log::info('Verification email sent successfully', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send verification email in SendVerifyEmail job', [
                'user_id' => $this->user->id,
                'email' => $this->user->email,
                'error' => $e->getMessage(),
            ]);
            if (str_contains($e->getMessage(), 'Invalid recipient') || str_contains($e->getMessage(), 'SMTP connect() failed')) {
                throw $e;
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SendVerifyEmail job failed after all retries', [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $verificationUrl;

    public function __construct($user, $verificationUrl)
    {
        $this->user = $user;
        $this->verificationUrl = $verificationUrl;
    }

    public function build()
    {
        return $this->from(config('mail.from.address'))
            ->subject("Verify Your Email for ${config('app.name')}")
            ->view('emails.verify')
            ->with([
                'name' => $this->user->name,
                'verificationUrl' => $this->verificationUrl,
            ]);
    }
}
<!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Hello {{ $name }},</h2>
        <p>Thank you for registering with {{ config('app.name') }}!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="{{ $verificationUrl }}" class="button">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>{{ $verificationUrl }}</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>{{ config('app.name') }} Team</p>
    </div>
</body>
</html>
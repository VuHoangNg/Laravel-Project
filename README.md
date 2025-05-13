VProject
VProject is a modular Laravel application with a React frontend, designed for managing media, comments, blogs, authentication, and user functionalities. It uses Laravel 9 with the nwidart/laravel-modules package for modular architecture, integrates with Pusher for real-time features, and leverages FFmpeg for video processing.
Table of Contents

Features
Prerequisites
Installation
Project Structure
Environment Configuration
Running the Application
Frontend Development
Available Scripts
API Endpoints
Contributing
License

Features

Modular Architecture: Organized into modules (Auth, Blog, Core, Media, User) using nwidart/laravel-modules.
Media Management: Upload, update, and delete media (images and videos) with HLS video processing using FFmpeg.
Comment System: Create, read, update, and delete comments on media, with nested comment support.
Real-Time Notifications: Integrated with Pusher for real-time updates.
Frontend: React-based frontend with Redux for state management, using Webpack for module bundling.
Authentication: Laravel Sanctum for API authentication.
Rate Limiting: Applied to comment creation to prevent abuse.

Prerequisites

PHP >= 8.0.2
Composer
Node.js >= 14.x
npm or Yarn
MySQL
FFmpeg (for video processing)
Windows: Ensure FFmpeg is installed at C:\FFMPEG\bin\ffmpeg.exe and ffprobe.exe as specified in .env.

Pusher account (for real-time features)

Installation

Clone the Repository:
git clone <repository-url>
cd VProject

Install PHP Dependencies:
composer install

Install Frontend Dependencies:
npm install

Copy Environment File:
cp .env.example .env

Generate Application Key:
php artisan key:generate

Configure Database:

Update .env with your MySQL database credentials:DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vproject
DB_USERNAME=root
DB_PASSWORD=

Run Migrations:
php artisan migrate

Set Up Pusher:

Add your Pusher credentials to .env:PUSHER_APP_ID=1986406
PUSHER_APP_KEY=f630b112e131865a702e
PUSHER_APP_SECRET=58cbb467f819efccd698
PUSHER_APP_CLUSTER=ap1

Set Up FFmpeg (for video processing):

Ensure FFmpeg is installed and the paths are correct in .env:FFMPEG_BINARIES=C:\FFMPEG\bin\ffmpeg.exe
FFPROBE_BINARIES=C:\FFMPEG\bin\ffprobe.exe

Project Structure
VProject/
├── app/ # Core Laravel application files
├── Modules/ # Modular structure using nwidart/laravel-modules
│ ├── Auth/ # Authentication module
│ ├── Blog/ # Blog module
│ ├── Core/ # Core functionality (e.g., notifications)
│ ├── Media/ # Media and comment management
│ └── User/ # User management
├── public/ # Public assets and compiled frontend files
│ └── modules/ # Compiled JavaScript for each module
├── database/ # Migrations, factories, and seeders
├── resources/ # Laravel views and assets
├── routes/ # Route definitions (e.g., api.php)
├── .env # Environment configuration
├── composer.json # PHP dependencies
├── package.json # Frontend dependencies
└── webpack.config.js # Webpack configuration for frontend

Environment Configuration
The .env file contains key configurations:

Database: MySQL connection settings (DB*\*).
Queue: Uses database driver (QUEUE_CONNECTION=database).
Sanctum: Configured for SPA authentication (SANCTUM_STATEFUL_DOMAINS).
Pusher: Real-time broadcasting (PUSHER*_).
FFmpeg: Paths for video processing (FFMPEG*BINARIES, FFPROBE_BINARIES).
Mail: Mailtrap for email testing (MAIL*_).

Running the Application

Start Laravel Server:
php artisan serve

The backend will run at http://127.0.0.1:8000.

Run Queue Worker (for video processing):
php artisan queue:work --queue=video-processing

Compile Frontend Assets:

For development (watch mode):npm run dev

Or for a specific module (e.g., Media):npm run media

Frontend Development

The frontend is built with React, using Redux for state management.
Each module has its own entry point (e.g., Modules/Media/Resources/assets/js/index.js).
Webpack compiles assets to public/modules/<module>/<module>.js.

Available Scripts

npm run build: Build all modules for production.
npm run dev: Build and watch all modules for development.
npm run auth: Watch the Auth module.
npm run core: Watch the Core module.
npm run blog: Watch the Blog module.
npm run media: Watch the Media module.
npm run user: Watch the User module.

API Endpoints
Media

GET /api/media: List all media (paginated).
POST /api/media: Upload new media (requires authentication).
GET /api/media/{id}: Get media by ID.
PUT/POST /api/media/{id}: Update media (requires authentication).
DELETE /api/media/{id}: Delete media (requires authentication).

Comments

POST /api/media/comments: Create a comment (requires authentication).
GET /api/media/{mediaId}/comments: Get comments for a media item.
GET /api/media/comments/{id}: Get a comment by ID (requires authentication).
PUT /api/media/comments/{id}: Update a comment (requires authentication).
DELETE /api/media/comments/{id}: Delete a comment (requires authentication).

Contributing

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit your changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
This project is licensed under the MIT License - see the LICENSE file for details.

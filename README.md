# VProject

**VProject** is a modular Laravel application with a React frontend, designed for managing media, comments, blogs, authentication, and user functionalities.

Built with **Laravel 9** and the `nwidart/laravel-modules` package, VProject provides a structured, modular architecture. It integrates **Pusher** for real-time features, uses **FFmpeg** for video processing, and offers a robust platform for media and user interaction.

---

## 🔑 Key Features

-   Modular architecture (Auth, Blog, Core, Media, User modules)
-   Media management with image and video support (including HLS processing)
-   Nested comment system for media items
-   Real-time notifications via Pusher
-   React frontend with Redux for state management
-   API authentication via Laravel Sanctum
-   Rate limiting on comment creation to prevent abuse

---

## 🚀 Getting Started

Follow the steps below to set up the project locally.

### 📚 Prerequisites

-   PHP >= 8.0.2
-   Composer
-   Node.js >= 14.x
-   npm or Yarn
-   MySQL
-   FFmpeg
-   Pusher account

> **Windows Users:**  
> Make sure FFmpeg is installed at:  
> `C:\FFMPEG\bin\ffmpeg.exe` and `ffprobe.exe`

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/VProject.git
cd VProject

# Install backend dependencies
composer install

# Install frontend dependencies
npm install

# Copy and configure the environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

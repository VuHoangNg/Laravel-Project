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

---

## 🔧 Configure Database

Update `.env` with your MySQL database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vproject
DB_USERNAME=root
DB_PASSWORD=
```

---

## 📊 Run Migrations

```bash
php artisan migrate
```

---

## 🎉 Set Up Pusher

Add your Pusher credentials to `.env`:

```env
PUSHER_APP_ID=1986406
PUSHER_APP_KEY=f630b112e131865a702e
PUSHER_APP_SECRET=58cbb467f819efccd698
PUSHER_APP_CLUSTER=ap1
```

---

## 🎥 Set Up FFmpeg

Ensure FFmpeg is installed and the paths are correct in `.env`:

```env
FFMPEG_BINARIES=C:\FFMPEG\bin\ffmpeg.exe
FFPROBE_BINARIES=C:\FFMPEG\bin\ffprobe.exe
```

---

## 📂 Project Structure

```plaintext
VProject/
├── app/                      # Core Laravel application files
├── Modules/                  # Modular structure using nwidart/laravel-modules
│   ├── Auth/                 # Authentication module
│   ├── Blog/                 # Blog module
│   ├── Core/                 # Core functionality (e.g., notifications)
│   ├── Media/                # Media and comment management
│   └── User/                 # User management
├── public/                   # Public assets and compiled frontend files
│   └── modules/              # Compiled JavaScript for each module
├── database/                 # Migrations, factories, and seeders
├── resources/                # Laravel views and assets
├── routes/                   # Route definitions (e.g., api.php)
├── .env                      # Environment configuration
├── composer.json             # PHP dependencies
├── package.json              # Frontend dependencies
└── webpack.config.js         # Webpack configuration for frontend
```

---

## ⚙️ Environment Configuration

The `.env` file contains key configurations:

-   **Database:** MySQL connection settings (`DB_*`).
-   **Queue:** Uses database driver (`QUEUE_CONNECTION=database`).
-   **Sanctum:** Configured for SPA authentication (`SANCTUM_STATEFUL_DOMAINS`).
-   **Pusher:** Real-time broadcasting (`PUSHER_*`).
-   **FFmpeg:** Paths for video processing (`FFMPEG_*`).
-   **Mail:** Mailtrap for email testing (`MAIL_*`).

---

## ▶️ Running the Application

### Start Laravel Server

```bash
php artisan serve
```

> The backend will run at [http://127.0.0.1:8000](http://127.0.0.1:8000).

### Run Queue Worker (for video processing)

```bash
php artisan queue:work --queue=video-processing
```

### Compile Frontend Assets

For development (watch mode):

```bash
npm run dev
```

Or for a specific module:

```bash
npm run media
```

---

## 🎨 Frontend Development

The frontend is built with **React**, using **Redux** for state management.
Each module has its own entry point (e.g., `Modules/Media/Resources/assets/js/index.js`).
Webpack compiles assets to:

```
public/modules/<module>/<module>.js
```

---

## 🛠️ Available Scripts

-   `npm run build`: Build all modules for production.
-   `npm run dev`: Build and watch all modules for development.
-   `npm run auth`: Watch the Auth module.
-   `npm run core`: Watch the Core module.
-   `npm run blog`: Watch the Blog module.
-   `npm run media`: Watch the Media module.
-   `npm run user`: Watch the User module.

---

## 📡 API Endpoints

### 📸 Media

-   `GET /api/media`: List all media (paginated)
-   `POST /api/media`: Upload new media (requires authentication)
-   `GET /api/media/{id}`: Get media by ID
-   `PUT|POST /api/media/{id}`: Update media (requires authentication)
-   `DELETE /api/media/{id}`: Delete media (requires authentication)

### 💬 Comments

-   `POST /api/media/comments`: Create a comment (requires authentication)
-   `GET /api/media/{mediaId}/comments`: Get comments for a media item
-   `GET /api/media/comments/{id}`: Get a comment by ID (requires authentication)
-   `PUT /api/media/comments/{id}`: Update a comment (requires authentication)
-   `DELETE /api/media/comments/{id}`: Delete a comment (requires authentication)

---

## 🤝 Contributing

Thank you for considering contributing to VProject! Follow these steps:

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Commit your changes:

```bash
git commit -m "Add your feature"
```

4. Push to the branch:

```bash
git push origin feature/your-feature
```

5. Open a pull request.

> For detailed guidelines, refer to the [Laravel Contribution Guide](https://laravel.com/docs/contributions).

---

## 📜 Code of Conduct

To ensure the VProject community is welcoming to all, please review and abide by the [Laravel Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

---

## 🔒 Security Vulnerabilities

If you discover a security vulnerability within VProject, please send an email to `your-email@example.com`. All security vulnerabilities will be promptly addressed.

---

## 📄 License

VProject is open-sourced software licensed under the [MIT License](LICENSE).

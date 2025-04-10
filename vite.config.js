import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'Modules/Auth/src/Resources/assets/js/app.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
});
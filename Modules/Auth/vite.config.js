const dotenvExpand = require('dotenv-expand');
dotenvExpand(require('dotenv').config({ path: '../../.env' }));

import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    build: {
        outDir: '../../public/build-auth',
        emptyOutDir: true,
        manifest: true,
    },
    plugins: [
        laravel({
            publicDirectory: '../../public',
            buildDirectory: 'build-auth',
            input: [
                __dirname + '/Resources/assets/sass/app.scss',
                __dirname + '/Resources/assets/js/app.jsx'
            ],
            refresh: true,
        }),
        react(),
    ],
});
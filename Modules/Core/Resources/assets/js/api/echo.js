import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const token = localStorage.getItem('auth_token');

if (!token) {
    console.error("No auth token found in localStorage. Please log in again.");
}

const APP_URL = process.env.APP_URL || "http://127.0.0.1:8000";

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.VITE_PUSHER_APP_KEY || 'f630b112e131865a702e',
    cluster: process.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
    forceTLS: false,
    authEndpoint: `${APP_URL}/api/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: token ? `Bearer ${token}` : null,
        },
    },
});
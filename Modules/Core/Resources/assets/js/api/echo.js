import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.Pusher = Pusher;

const token = localStorage.getItem('auth_token');

if (!token) {
    console.error("No auth token found in localStorage. Please log in again.");
}

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: 'f630b112e131865a702e',
    cluster: 'ap1',
    forceTLS: false,
    authEndpoint: 'http://127.0.0.1:8000/api/broadcasting/auth',
    auth: {
        headers: {
            Authorization: token ? `Bearer ${token}` : null,
        },
    },
});
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const isHttps = typeof window !== 'undefined'
    ? window.location.protocol === 'https:'
    : (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https';

const wsHost = (typeof window !== 'undefined' && window.location.hostname)
    ? window.location.hostname
    : (import.meta.env.VITE_REVERB_HOST || '10.10.100.193');

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: wsHost,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
});

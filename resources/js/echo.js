import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const isHttps = typeof window !== 'undefined'
    ? window.location.protocol === 'https:'
    : (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https';

const wsHost = (typeof window !== 'undefined' && window.location.hostname)
    ? window.location.hostname
    : (import.meta.env.VITE_REVERB_HOST || '10.10.100.193');

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

// Tanpa app key, Pusher melempar error dan seluruh halaman gagal tampil.
if (reverbKey) {
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: wsHost,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: isHttps,
        enabledTransports: ['ws', 'wss'],
    });
} else {
    console.warn('[Echo] VITE_REVERB_APP_KEY belum diset; realtime dinonaktifkan.');
}

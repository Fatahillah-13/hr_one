// Ikon garis sederhana untuk tampilan HR One (tanpa library tambahan).
const P = {
    home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
    users: <><path d="M16 21v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1" /><circle cx="9" cy="8" r="4" /><path d="M22 21v-1a4 4 0 00-3-3.9M16 4.1a4 4 0 010 7.8" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="12" r="2.5" /><path d="M14 10h4M14 14h4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    back: <path d="M15 18l-6-6 6-6" />,
    next: <path d="M9 6l6 6-6 6" />,
    up: <path d="M18 15l-6-6-6 6" />,
    down: <path d="M6 9l6 6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M5 13l4 4L19 7" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    out: <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></>,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-9 5.7a2 2 0 01-2 0L2 7" /></>,
    wallet: <><rect x="2" y="6" width="20" height="14" rx="3" /><path d="M16 13h2M2 10h20" /></>,
    alert: <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />,
    upload: <path d="M12 20V9m0 0l-4 4m4-4l4 4M5 4h14" />,
    download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>,
    more: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    headset: <><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20a3 3 0 01-3 2h-3" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2" />,
    door: <><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h8" /><path d="M17 16l4-4-4-4M21 12H9" /></>,
    box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>,
    cam: <><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></>,
    exit: <><path d="M4 4h10v16H4z" /><path d="M14 12h7m-3-3l3 3-3 3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
    file: <><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6" /></>,
    link: <><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" /></>,
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    chat: <><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /><path d="M8.5 11h7M8.5 14.5h4" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></>,
};

export const ICONS = Object.keys(P);

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 2, ...rest }) {
    const d = P[name] || P.grid;
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
            {d}
        </svg>
    );
}

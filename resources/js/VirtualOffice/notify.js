// Penghubung kecil antara Virtual Office dan halaman HR One lain:
// jumlah pesan belum dibaca (badge header), suara, dan notifikasi desktop.
import { useEffect, useState } from 'react';

const store = { unread: null };
const EVT = 'vo:unread';

const safeGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* abaikan */ } };

export function setUnread(n) {
  const v = Math.max(0, Number(n) || 0);
  if (store.unread === v) return;
  store.unread = v;
  window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
}
export function addUnread(d = 1) {
  setUnread((store.unread || 0) + d);
}
export function getUnread() {
  return store.unread;
}

/** Badge di Navbar / menu HP. `initial` dari props Inertia (`virtualOffice.unread`). */
export function useVoUnread(initial = 0) {
  const [n, setN] = useState(() => store.unread ?? initial);
  useEffect(() => {
    if (store.unread === null) store.unread = initial || 0;
    else setN(store.unread);
    const h = (e) => setN(e.detail);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // data baru dari server (pindah halaman Inertia) menang atas hitungan lokal
    if (typeof initial === 'number') setUnread(initial);
  }, [initial]);
  return n;
}

// ---------- preferensi ----------
export const prefs = {
  sound: () => safeGet('vo-sound', 'on') === 'on',
  setSound: (on) => safeSet('vo-sound', on ? 'on' : 'off'),
  desktop: () => safeGet('vo-desktop', 'off') === 'on' && typeof Notification !== 'undefined' && Notification.permission === 'granted',
  setDesktop: (on) => safeSet('vo-desktop', on ? 'on' : 'off'),
};

export async function enableDesktop() {
  if (typeof Notification === 'undefined') return false;
  const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  prefs.setDesktop(p === 'granted');
  return p === 'granted';
}

// ---------- suara "ting" (tanpa file audio) ----------
let ctx = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}
// Browser hanya mengizinkan suara setelah pengguna pernah klik/ketik di halaman.
if (typeof window !== 'undefined') {
  const unlock = () => { audio()?.resume?.(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}
export function playPing() {
  if (!prefs.sound()) return;
  const a = audio();
  if (!a || a.state !== 'running') return;
  const t = a.currentTime;
  [[880, 0], [1320, 0.11]].forEach(([f, d]) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.28);
    o.connect(g).connect(a.destination);
    o.start(t + d);
    o.stop(t + d + 0.3);
  });
}

export function desktopNotify(title, body, onClick) {
  if (!prefs.desktop() || document.visibilityState === 'visible') return;
  try {
    const n = new Notification(title, { body, tag: 'vo-chat', renotify: true });
    n.onclick = () => { window.focus(); onClick?.(); n.close(); };
  } catch { /* abaikan */ }
}

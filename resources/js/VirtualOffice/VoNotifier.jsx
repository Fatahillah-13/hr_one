import React, { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { BASE } from './api';
import { addUnread, desktopNotify, playPing } from './notify';
import { ensureGlobalOfficeChannel } from './useRealtime';
import '../../css/vo-notifier.css';

const initialsOf = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
const COLORS = ['#4C6FFF', '#8A5A44', '#4F7A30', '#7A4E8C', '#A9502F', '#3E6E6E', '#8C6417', '#2F4BD8'];

/**
 * Dipasang sekali di AuthenticatedLayout HR One.
 * Mendengar pesan Virtual Office di semua halaman: popup kecil di pojok kanan bawah,
 * suara "ting", notifikasi desktop (kalau tab tidak aktif), dan menambah badge di header.
 */
export default function VoNotifier() {
  const { props } = usePage();
  const user = props?.auth?.user;
  const enabled = !!props?.virtualOffice;
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const open = (cid) => {
    if (window.location.pathname.startsWith(BASE)) {
      window.dispatchEvent(new CustomEvent('vo:open-chat', { detail: cid }));
    } else {
      router.visit(`${BASE}?chat=${cid}`);
    }
  };

  const dismiss = (id) => {
    clearTimeout(timers.current[id]);
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  // Bergabung ke presence channel vo.office sekundari setelah VoNotifier aktif.
  // Inilah yang membuat user terlihat online di seluruh HR One, bukan hanya di halaman Virtual Office.
  useEffect(() => {
    if (!enabled || !user) return undefined;
    if (!window.Echo) {
      console.warn('[Virtual Office] window.Echo belum ada. Jalankan `php artisan install:broadcasting`.');
      return undefined;
    }
    ensureGlobalOfficeChannel(user.id);
    return undefined;
  }, [enabled, user]);

  useEffect(() => {
    const Echo = window.Echo;
    if (!enabled || !user || !Echo) return undefined;

    const onMessage = (e) => {
      const m = e.message;
      if (!m || m.user_id === user.id) return;
      const onVo = window.location.pathname.startsWith(BASE);
      const viewing = onVo && window.__voActiveConversation === m.conversation_id && document.visibilityState === 'visible';
      if (viewing) return; // sedang dibaca di Virtual Office

      if (!onVo) addUnread(1); // di halaman Virtual Office, badge dihitung oleh halaman itu sendiri
      playPing();

      const group = e.conversation?.type === 'group' ? e.conversation.name : null;
      const preview = m.body || (m.attachment ? `📎 ${m.attachment.name}` : 'Pesan baru');
      desktopNotify(group ? `${m.user_name} · ${group}` : m.user_name, preview, () => open(m.conversation_id));

      const id = `${m.id}`;
      setToasts((t) => [...t.filter((x) => x.cid !== m.conversation_id), {
        id, cid: m.conversation_id, uid: m.user_id, name: m.user_name, group, preview,
      }].slice(-3));
      timers.current[id] = setTimeout(() => dismiss(id), 7000);
    };

    const ch = Echo.private(`vo.user.${user.id}`).listen('.message.sent', onMessage);
    return () => ch.stopListening('.message.sent', onMessage);
  }, [enabled, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toasts.length) return null;

  return (
    <div className="vo-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="vo-toast-card" role="status">
          <button type="button" className="vo-toast-main" onClick={() => { dismiss(t.id); open(t.cid); }}>
            <span className="vo-toast-avatar" style={{ background: COLORS[Math.abs(t.uid) % COLORS.length] }}>{initialsOf(t.name)}</span>
            <span className="vo-toast-text">
              <b>{t.name}</b>
              <small>{t.group ? `di grup ${t.group}` : 'Chat pribadi'}</small>
              <span>{t.preview}</span>
            </span>
          </button>
          <button type="button" className="vo-toast-x" aria-label="Tutup notifikasi" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

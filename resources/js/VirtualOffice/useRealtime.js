import { useEffect, useRef, useState } from 'react';

/**
 * Langganan channel realtime (Laravel Echo + Reverb).
 * - presence `vo.office`  → daftar user online + perubahan status/avatar
 * - private `vo.user.{id}` → pesan baru, grup baru, tanda dibaca
 * - whisper `activity` di `vo.office` → siapa sedang mengetik chat (pribadi/grup), tanpa lewat server
 * Handler disimpan di ref supaya listener tidak perlu dipasang ulang tiap render.
 */
export function useRealtime(meId, handlers) {
  const [onlineIds, setOnlineIds] = useState(() => new Set([meId]));
  const [connected, setConnected] = useState(false);
  const h = useRef(handlers);
  h.current = handlers;
  const officeRef = useRef(null);

  useEffect(() => {
    const Echo = window.Echo;
    if (!Echo) {
      console.warn('[Virtual Office] window.Echo belum ada. Jalankan `php artisan install:broadcasting`.');
      return undefined;
    }

    officeRef.current = Echo.join('vo.office')
      .here((users) => {
        setOnlineIds(new Set(users.map((u) => u.id)));
        setConnected(true);
      })
      .joining((u) => setOnlineIds((s) => new Set(s).add(u.id)))
      .leaving((u) =>
        setOnlineIds((s) => {
          const n = new Set(s);
          n.delete(u.id);
          return n;
        }),
      )
      .listen('.profile.updated', (e) => h.current.onProfile?.(e.user_id, e.profile))
      .listen('.layout.updated', (e) => h.current.onLayout?.(e))
      .listenForWhisper('activity', (e) => h.current.onActivity?.(e));

    // channel pribadi juga dipakai VoNotifier di header HR One → jangan di-leave, cukup lepas listener sendiri
    const onMsg = (e) => h.current.onMessage?.(e.message);
    const onConv = (e) => h.current.onConversation?.(e.conversation);
    const onRead = (e) => h.current.onRead?.(e);
    const mine = Echo.private(`vo.user.${meId}`)
      .listen('.message.sent', onMsg)
      .listen('.conversation.created', onConv)
      .listen('.conversation.read', onRead);

    const conn = Echo.connector?.pusher?.connection;
    const onState = (s) => setConnected(s.current === 'connected');
    conn?.bind('state_change', onState);

    return () => {
      conn?.unbind('state_change', onState);
      officeRef.current = null;
      Echo.leave('vo.office');
      mine.stopListening('.message.sent', onMsg);
      mine.stopListening('.conversation.created', onConv);
      mine.stopListening('.conversation.read', onRead);
    };
  }, [meId]);

  /** Beri tahu semua orang di lantai: aku sedang (atau berhenti) mengetik. kind = 'personal' | 'group'. */
  const notifyActivity = (kind, active) => {
    officeRef.current?.whisper('activity', { user_id: meId, kind, active });
  };

  return { onlineIds, connected, notifyActivity };
}

/** Indikator "sedang mengetik" lewat whisper di channel percakapan yang sedang dibuka. */
export function useTyping(conversationId, meName) {
  const [typing, setTyping] = useState(null);
  const channelRef = useRef(null);
  const lastSent = useRef(0);

  useEffect(() => {
    const Echo = window.Echo;
    if (!Echo || !conversationId) return undefined;
    let timer;
    const ch = Echo.private(`vo.conversation.${conversationId}`).listenForWhisper('typing', (e) => {
      setTyping(e.name);
      clearTimeout(timer);
      timer = setTimeout(() => setTyping(null), 3000);
    });
    channelRef.current = ch;
    return () => {
      clearTimeout(timer);
      setTyping(null);
      Echo.leave(`vo.conversation.${conversationId}`);
      channelRef.current = null;
    };
  }, [conversationId]);

  const notifyTyping = () => {
    const now = Date.now();
    if (channelRef.current && now - lastSent.current > 2000) {
      lastSent.current = now;
      channelRef.current.whisper('typing', { name: meName });
    }
  };

  return { typing, notifyTyping };
}

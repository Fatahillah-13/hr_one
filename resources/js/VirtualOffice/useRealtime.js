import { useEffect, useRef, useState } from 'react';

/**
 * Langganan channel realtime (Laravel Echo + Reverb).
 * - presence `vo.office`  → daftar user online + perubahan status/avatar
 * - private `vo.user.{id}` → pesan baru, grup baru, tanda dibaca
 * - whisper `activity` di `vo.office` → siapa sedang mengetik chat (pribadi/grup), tanpa lewat server
 * Handler disimpan di ref supaya listener tidak perlu dipasang ulang tiap render.
 */
let globalOfficeChannel = null;
let globalOnlineIds = new Set();
let globalConnected = false;
const presenceListeners = new Set();

function emitPresence() {
  const ids = new Set(globalOnlineIds);
  const conn = globalConnected;
  presenceListeners.forEach((fn) => {
    try {
      fn(ids, conn);
    } catch (e) {
      console.error('[Virtual Office] presence listener error:', e);
    }
  });
}

export function subscribePresence(callback) {
  presenceListeners.add(callback);
  callback(new Set(globalOnlineIds), globalConnected);
  return () => presenceListeners.delete(callback);
}

/**
 * Pastikan user bergabung ke presence channel `vo.office` secara global di HR One.
 * Channel ini bertahan selama user membuka HR One, tidak terputus saat berpindah halaman.
 */
export function ensureGlobalOfficeChannel(meId) {
  const Echo = window.Echo;
  if (!Echo || !meId) return null;

  if (globalOfficeChannel) {
    if (!globalOnlineIds.has(meId)) {
      globalOnlineIds.add(meId);
      emitPresence();
    }
    return globalOfficeChannel;
  }

  const conn = Echo.connector?.pusher?.connection;
  if (conn?.state === 'connected') {
    globalConnected = true;
  }
  const onState = (s) => {
    globalConnected = s.current === 'connected';
    emitPresence();
  };
  conn?.bind('state_change', onState);

  globalOnlineIds.add(meId);

  try {
    globalOfficeChannel = Echo.join('vo.office')
      .here((users) => {
        globalOnlineIds = new Set(users.map((u) => u.id));
        globalConnected = true;
        emitPresence();
      })
      .joining((u) => {
        globalOnlineIds.add(u.id);
        emitPresence();
      })
      .leaving((u) => {
        globalOnlineIds.delete(u.id);
        emitPresence();
      })
      .error((err) => {
        console.error('[Virtual Office] Error joining presence channel vo.office:', err);
      });
  } catch (err) {
    console.error('[Virtual Office] Exception joining vo.office:', err);
  }

  if (typeof window !== 'undefined' && !window.__voUnloadBound) {
    window.__voUnloadBound = true;
    window.addEventListener('beforeunload', () => {
      if (globalOfficeChannel) {
        Echo.leave('vo.office');
        globalOfficeChannel = null;
      }
    });
  }

  return globalOfficeChannel;
}

export function useRealtime(meId, handlers) {
  const [onlineIds, setOnlineIds] = useState(() => new Set(globalOnlineIds.size ? globalOnlineIds : [meId]));
  const [connected, setConnected] = useState(globalConnected);
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const Echo = window.Echo;
    if (!Echo) {
      console.warn('[Virtual Office] window.Echo belum ada. Jalankan `php artisan install:broadcasting`.');
      return undefined;
    }

    const ch = ensureGlobalOfficeChannel(meId);
    const unsub = subscribePresence((ids, conn) => {
      setOnlineIds(ids);
      setConnected(conn);
    });

    const onProf = (e) => h.current.onProfile?.(e.user_id, e.profile);
    const onLay = (e) => h.current.onLayout?.(e);
    const onAct = (e) => h.current.onActivity?.(e);

    ch?.listen('.profile.updated', onProf)
      ?.listen('.layout.updated', onLay)
      ?.listenForWhisper('activity', onAct);

    // channel pribadi juga dipakai VoNotifier di header HR One → jangan di-leave, cukup lepas listener sendiri
    const onMsg = (e) => h.current.onMessage?.(e.message);
    const onConv = (e) => h.current.onConversation?.(e.conversation);
    const onRead = (e) => h.current.onRead?.(e);
    const mine = Echo.private(`vo.user.${meId}`)
      ?.listen('.message.sent', onMsg)
      ?.listen('.conversation.created', onConv)
      ?.listen('.conversation.read', onRead);

    return () => {
      unsub();
      ch?.stopListening('.profile.updated', onProf)
        ?.stopListening('.layout.updated', onLay)
        ?.stopListeningForWhisper('activity', onAct);
      if (mine) {
        mine.stopListening('.message.sent', onMsg)
          ?.stopListening('.conversation.created', onConv)
          ?.stopListening('.conversation.read', onRead);
      }
      // PENTING: Jangan Echo.leave('vo.office') di sini!
      // User tetap online selama masih membuka HR One di tab/halaman manapun.
    };
  }, [meId]);

  /** Beri tahu semua orang di lantai: aku sedang (atau berhenti) mengetik. kind = 'personal' | 'group'. */
  const notifyActivity = (kind, active) => {
    globalOfficeChannel?.whisper('activity', { user_id: meId, kind, active });
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

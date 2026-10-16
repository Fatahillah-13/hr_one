import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import OfficeFloor from '../../VirtualOffice/OfficeFloor';
import ChatPanel from '../../VirtualOffice/ChatPanel';
import StatusDialog from '../../VirtualOffice/StatusDialog';
import AvatarDialog from '../../VirtualOffice/AvatarDialog';
import Avatar from '../../VirtualOffice/Avatar';
import { buildScene } from '../../VirtualOffice/scene';
import { useRealtime } from '../../VirtualOffice/useRealtime';
import { BASE, api, errorText } from '../../VirtualOffice/api';
import { enableDesktop, prefs, setUnread } from '../../VirtualOffice/notify';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import '../../../css/virtual-office.css';

// Halaman Virtual Office di dalam layout HR One (header, menu HP, notifikasi global).
export default function VirtualOfficeIndex({ me, users: initialUsers, seats, objects = [], canEdit = false }) {
  const [users, setUsers] = useState(initialUsers);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [threads, setThreads] = useState({}); // { [conversationId]: { items, hasMore, loaded } }
  const [selectedId, setSelectedId] = useState(null);
  const [zone, setZone] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null); // 'status' | 'avatar'
  const [toast, setToast] = useState('');
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const scene = useMemo(() => buildScene(seats, objects), [seats, objects]);

  // data karyawan baru dari server (setelah denah dipublikasikan) → gabungkan, profil realtime tetap dipakai
  useEffect(() => {
    setUsers((cur) => {
      const prof = Object.fromEntries(cur.map((u) => [u.id, u.profile]));
      return initialUsers.map((u) => ({ ...u, profile: prof[u.id] || u.profile }));
    });
  }, [initialUsers]);
  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const meUser = usersById[me.id] || { ...me, profile: {} };
  const zones = useMemo(() => [...new Set(seats.map((s) => s.zone))].sort(), [seats]);

  // Petakan kode zona (A, B, C...) ke nama label zona dari objek denah (zone_label)
  const zoneNames = useMemo(() => {
    const map = {};
    const labels = objects.filter((o) => o.type === 'zone_label' && o.label);
    zones.forEach((z) => {
      // 1. Coba cari label yang secara eksplisit memuat kode zona (misal: "ZONA A - HI Team")
      const direct = labels.find((l) => new RegExp(`(^|\\b)ZONA\\s+${z}(\\b|$)`, 'i').test(l.label));
      if (direct) {
        map[z] = direct.label.replace(new RegExp(`(^|\\b)ZONA\\s+${z}\\s*[:-]?\\s*`, 'i'), '').trim() || direct.label;
        return;
      }
      // 2. Cari label terdekat berdasarkan posisi geometri meja zona tersebut
      const zoneSeats = seats.filter((s) => s.zone === z);
      if (zoneSeats.length && labels.length) {
        const avgX = zoneSeats.reduce((acc, s) => acc + s.x + s.w / 2, 0) / zoneSeats.length;
        const avgY = zoneSeats.reduce((acc, s) => acc + s.y + s.d / 2, 0) / zoneSeats.length;
        let closest = null;
        let minDist = Infinity;
        labels.forEach((l) => {
          const lx = l.x + l.w / 2;
          const ly = l.y + l.d / 2;
          const dist = Math.hypot(lx - avgX, ly - avgY);
          if (dist < minDist) {
            minDist = dist;
            closest = l;
          }
        });
        if (closest && minDist < 280) {
          map[z] = closest.label;
        }
      }
    });
    return map;
  }, [zones, seats, objects]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // bubble yang kedaluwarsa disembunyikan tanpa menunggu server
  // (dihitung ulang hanya saat data karyawan berubah / tiap 30 detik, supaya lantai 3D tidak digambar ulang tiap ketikan)
  const [tickN, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const visibleUsers = useMemo(() => {
    const now = new Date();
    return users.map((u) => {
      const exp = u.profile?.bubble_expires_at;
      return exp && new Date(exp) < now ? { ...u, profile: { ...u.profile, bubble: null } } : u;
    });
  }, [users, tickN]);
  const visibleById = useMemo(() => Object.fromEntries(visibleUsers.map((u) => [u.id, u])), [visibleUsers]);

  // ---------- data chat ----------
  const loadConversations = useCallback(() => api.conversations().then(setConversations).catch(() => {}), []);
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const markRead = useCallback((cid) => {
    api.read(cid).catch(() => {});
    setConversations((cs) => cs.map((c) => (c.id === cid ? { ...c, unread: 0 } : c)));
  }, []);

  const openConversation = useCallback(
    async (cid) => {
      setActiveId(cid);
      markRead(cid);
      if (!threads[cid]?.loaded) {
        setThreads((t) => ({ ...t, [cid]: { items: [], hasMore: false, loaded: false } }));
        try {
          const res = await api.messages(cid);
          setThreads((t) => ({ ...t, [cid]: { items: res.messages, hasMore: res.has_more, loaded: true } }));
        } catch (e) {
          // jangan biarkan "Memuat…" selamanya: tampilkan kosong + pesan, bisa dibuka ulang
          setThreads((t) => ({ ...t, [cid]: { items: [], hasMore: false, loaded: false, error: true } }));
          flash(errorText(e));
        }
      }
    },
    [threads, markRead],
  );

  const loadMore = async (cid) => {
    const first = threads[cid]?.items[0];
    if (!first) return;
    let res;
    try {
      res = await api.messages(cid, first.id);
    } catch (e) {
      flash(errorText(e));
      return;
    }
    setThreads((t) => ({ ...t, [cid]: { ...t[cid], items: [...res.messages, ...t[cid].items], hasMore: res.has_more } }));
  };

  const appendMessage = useCallback((m) => {
    setThreads((t) => {
      const th = t[m.conversation_id];
      if (!th || th.items.some((x) => x.id === m.id)) return t;
      return { ...t, [m.conversation_id]: { ...th, items: [...th.items, m] } };
    });
    setConversations((cs) =>
      cs
        .map((c) => (c.id === m.conversation_id ? { ...c, last_message: m, updated_at: m.created_at } : c))
        .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')),
    );
  }, []);

  const send = async (cid, body, file) => {
    try {
      const m = await api.send(cid, body, file);
      appendMessage(m);
    } catch (e) {
      throw new Error(errorText(e));
    }
  };

  const chatWith = async (userId) => {
    try {
      const c = await api.openPersonal(userId);
      setConversations((cs) => (cs.some((x) => x.id === c.id) ? cs : [c, ...cs]));
      setSelectedId(null);
      openConversation(c.id);
    } catch (e) {
      flash(errorText(e));
    }
  };

  const createGroup = async (name, ids) => {
    try {
      const c = await api.createGroup(name, ids);
      setConversations((cs) => [c, ...cs]);
      openConversation(c.id);
    } catch (e) {
      throw new Error(errorText(e));
    }
  };

  // ---------- realtime ----------
  // siapa sedang mengetik chat: { [userId]: { kind: 'personal'|'group', at } }
  const [activity, setActivity] = useState({});
  const setUserActivity = useCallback((uid, kind, active) => {
    setActivity((a) => {
      if (!active) {
        if (!a[uid]) return a;
        const n = { ...a };
        delete n[uid];
        return n;
      }
      return { ...a, [uid]: { kind, at: Date.now() } };
    });
  }, []);
  // jaga-jaga kalau sinyal "berhenti" tidak sampai: hapus yang tidak diperbarui > 6 detik
  useEffect(() => {
    const t = setInterval(() => {
      setActivity((a) => {
        const now = Date.now();
        const keep = Object.entries(a).filter(([, v]) => now - v.at < 6000);
        return keep.length === Object.keys(a).length ? a : Object.fromEntries(keep);
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const { onlineIds, connected, notifyActivity } = useRealtime(me.id, {
    onActivity: (e) => setUserActivity(e.user_id, e.kind, e.active),
    onProfile: (uid, profile) => setUsers((us) => us.map((u) => (u.id === uid ? { ...u, profile } : u))),
    onMessage: (m) => {
      setUserActivity(m.user_id, null, false);
      const known = conversations.some((c) => c.id === m.conversation_id);
      if (!known) {
        loadConversations();
        return;
      }
      appendMessage(m);
      if (m.user_id !== me.id) {
        if (activeRef.current === m.conversation_id && document.visibilityState === 'visible') {
          markRead(m.conversation_id);
        } else {
          setConversations((cs) => cs.map((c) => (c.id === m.conversation_id ? { ...c, unread: c.unread + 1 } : c)));
        }
      }
    },
    onLayout: (e) => {
      router.reload({ only: ['seats', 'objects', 'users'] });
      if (e.published_by) flash(`Denah diperbarui oleh ${e.published_by}`);
    },
    onConversation: (c) => setConversations((cs) => (cs.some((x) => x.id === c.id) ? cs : [c, ...cs])),
    onRead: (e) =>
      setConversations((cs) =>
        cs.map((c) =>
          c.id === e.conversation_id && c.type === 'personal' && c.peer_id === e.reader_id
            ? { ...c, peer_last_read_id: e.last_read_message_id }
            : c,
        ),
      ),
  });

  // tandai dibaca saat tab browser kembali aktif
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && activeRef.current && markRead(activeRef.current);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [markRead]);

  const onlineCount = users.filter((u) => onlineIds.has(u.id)).length;
  const results = search.trim()
    ? users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : [];

  const updateMyProfile = (profile) => setUsers((us) => us.map((u) => (u.id === me.id ? { ...u, profile } : u)));

  // ---------- sinkron dengan header HR One & notifikasi ----------
  // badge "Virtual Office" di header = total pesan belum dibaca di daftar chat
  useEffect(() => {
    setUnread(conversations.reduce((s, c) => s + (c.unread || 0), 0));
  }, [conversations]);
  // VoNotifier perlu tahu percakapan mana yang sedang dibaca (supaya tidak memunculkan popup)
  useEffect(() => {
    window.__voActiveConversation = activeId;
    return () => { window.__voActiveConversation = null; };
  }, [activeId]);
  // buka chat dari popup notifikasi / tautan ?chat=ID
  const pendingChat = useRef(Number(new URLSearchParams(window.location.search).get('chat')) || null);
  useEffect(() => {
    if (pendingChat.current && conversations.some((c) => c.id === pendingChat.current)) {
      openConversation(pendingChat.current);
      pendingChat.current = null;
    }
  }, [conversations]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e) => {
      if (conversations.some((c) => c.id === e.detail)) openConversation(e.detail);
      else { pendingChat.current = e.detail; loadConversations(); }
    };
    window.addEventListener('vo:open-chat', h);
    return () => window.removeEventListener('vo:open-chat', h);
  });
  const [soundOn, setSoundOn] = useState(prefs.sound());
  const [desktopOn, setDesktopOn] = useState(prefs.desktop());

  return (
    <AuthenticatedLayout hideFooter={true}>
    <div className="vo-app">
      <Head title="Virtual Office" />

      <header className="vo-header">
        <div className="vo-brand">
          <span className="vo-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></svg>
          </span>
          <div>
            <strong>Virtual Office</strong>
            <small>Lantai HRD</small>
          </div>
        </div>
        <div className="vo-search">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari karyawan…" aria-label="Cari karyawan" />
          {results.length > 0 && (
            <div className="vo-search-results">
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSearch('');
                    if (u.seat_code) setSelectedId(u.id);
                    else if (u.id !== me.id) chatWith(u.id);
                  }}
                >
                  <Avatar user={u} ring={false} size={28} />
                  <span>{u.name}</span>
                  <small>{u.seat_code ? `Meja ${u.seat_code}` : 'Belum punya meja'}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="vo-grow" />
        <span className={`vo-online${connected ? '' : ' is-off'}`}>
          <i />
          {connected ? `${onlineCount} online · ${users.length} orang` : 'Menyambungkan…'}
        </span>
        <button
          type="button"
          className={`vo-icon-btn${soundOn ? ' is-on' : ''}`}
          aria-pressed={soundOn}
          title={soundOn ? 'Suara notifikasi: aktif' : 'Suara notifikasi: mati'}
          aria-label="Suara notifikasi"
          onClick={() => { prefs.setSound(!soundOn); setSoundOn(!soundOn); }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 003.4 0" />
            {!soundOn && <path d="M3 3l18 18" />}
          </svg>
        </button>
        {!desktopOn && typeof Notification !== 'undefined' && (
          <button type="button" className="vo-btn" onClick={async () => setDesktopOn(await enableDesktop())}>
            Aktifkan notifikasi desktop
          </button>
        )}
        {canEdit && <a className="vo-btn" href={`${BASE}/editor`}>Editor denah</a>}
        <button type="button" className="vo-btn" onClick={() => setDialog('status')}>Atur status</button>
        <button type="button" className="vo-btn vo-btn-me" onClick={() => setDialog('avatar')}>
          <Avatar user={meUser} status={meUser.profile?.status || 'online'} size={32} />
          Avatar saya
        </button>
      </header>

      <main className="vo-main">
        <section className="vo-floor-card">
          <div className="vo-floor-top">
            <h1>Lantai HRD</h1>
            <div className="vo-chips" role="group" aria-label="Filter zona">
              {['all', ...zones].map((z) => {
                const label = z === 'all' ? 'Semua' : (zoneNames[z] ? `${z} - ${zoneNames[z]}` : `Zona ${z}`);
                return (
                  <button key={z} type="button" className={zone === z ? 'is-on' : ''} onClick={() => setZone(z)}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <OfficeFloor
            scene={scene}
            people={visibleUsers}
            onlineIds={onlineIds}
            zone={zone}
            zoneNames={zoneNames}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChat={chatWith}
            meId={me.id}
            activity={activity}
          />
        </section>

        <ChatPanel
          me={meUser}
          usersById={visibleById}
          onlineIds={onlineIds}
          conversations={conversations}
          activeId={activeId}
          onOpen={openConversation}
          thread={threads[activeId]}
          onLoadMore={loadMore}
          onSend={send}
          onCreateGroup={createGroup}
          onActivity={(kind, active) => {
            notifyActivity(kind, active);
            setUserActivity(me.id, kind, active);
          }}
        />
      </main>

      {dialog === 'status' && <StatusDialog me={meUser} onClose={() => setDialog(null)} onSaved={updateMyProfile} />}
      {dialog === 'avatar' && <AvatarDialog me={meUser} onClose={() => setDialog(null)} onSaved={updateMyProfile} />}
      {toast && <div className="vo-toast" role="status">{toast}</div>}
    </div>
    </AuthenticatedLayout>
  );
}

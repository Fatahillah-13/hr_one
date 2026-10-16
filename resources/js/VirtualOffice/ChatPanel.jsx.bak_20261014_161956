import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Avatar, { STATUS, effectiveStatus } from './Avatar';
import { useTyping } from './useRealtime';

const timeOf = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

const sizeOf = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function preview(m, meId) {
  if (!m) return 'Belum ada pesan';
  const who = m.user_id === meId ? 'Kamu: ' : '';
  return who + (m.body || (m.attachment ? `📎 ${m.attachment.name}` : ''));
}

export default function ChatPanel({
  me, usersById, onlineIds, conversations, activeId, onOpen, thread, onLoadMore, onSend, onCreateGroup, onActivity,
}) {
  const [tab, setTab] = useState('personal');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showGroup, setShowGroup] = useState(false);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const { typing, notifyTyping } = useTyping(activeId, me.name);

  // status "sedang mengetik" di lantai: dikirim tiap 2 detik selama mengetik,
  // dihentikan saat pesan terkirim, kolom dikosongkan, atau 4 detik tidak ada ketikan
  const activity = useRef({ kind: null, lastSent: 0, idle: null });
  const stopActivity = () => {
    const a = activity.current;
    clearTimeout(a.idle);
    if (a.kind) onActivity?.(a.kind, false);
    a.kind = null;
    a.lastSent = 0;
  };
  const pingActivity = (kind) => {
    const a = activity.current;
    if (a.kind && a.kind !== kind) stopActivity();
    const now = Date.now();
    if (a.kind !== kind || now - a.lastSent > 2000) {
      onActivity?.(kind, true);
      a.lastSent = now;
    }
    a.kind = kind;
    clearTimeout(a.idle);
    a.idle = setTimeout(stopActivity, 4000);
  };
  useEffect(() => stopActivity, [activeId]); // ganti percakapan / tutup halaman = berhenti mengetik

  const active = conversations.find((c) => c.id === activeId);
  const shown = conversations.filter((c) => c.type === tab);
  const unreadP = conversations.filter((c) => c.type === 'personal').reduce((s, c) => s + c.unread, 0);
  const unreadG = conversations.filter((c) => c.type === 'group').reduce((s, c) => s + c.unread, 0);

  useEffect(() => {
    if (active) setTab(active.type);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // auto-scroll ke pesan terbaru
  const lastId = thread?.items?.[thread.items.length - 1]?.id;
  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [activeId, lastId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!active || sending || (!text.trim() && !file)) return;
    setSending(true);
    setError('');
    try {
      stopActivity();
      await onSend(active.id, text.trim(), file);
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const peer = active?.type === 'personal' ? usersById[active.peer_id] : null;
  const peerStatus = peer ? effectiveStatus(peer, onlineIds) : null;

  return (
    <aside className="vo-chat">
      <div className="vo-chat-top">
        <div className="vo-row">
          <h2>Chat</h2>
          <button type="button" className="vo-btn vo-btn-ghost" onClick={() => setShowGroup(true)}>
            + Grup baru
          </button>
        </div>
        <div className="vo-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'personal'} onClick={() => setTab('personal')}>
            Personal {unreadP > 0 && <b>{unreadP}</b>}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'group'} onClick={() => setTab('group')}>
            Grup {unreadG > 0 && <b>{unreadG}</b>}
          </button>
        </div>
      </div>

      <div className="vo-conv-list">
        {shown.length === 0 && (
          <p className="vo-empty">
            {tab === 'personal' ? 'Klik avatar di lantai lalu tekan Chat untuk mulai.' : 'Belum ada grup.'}
          </p>
        )}
        {shown.map((c) => {
          const u = c.type === 'personal' ? usersById[c.peer_id] : null;
          return (
            <button
              key={c.id}
              type="button"
              className={`vo-conv${c.id === activeId ? ' is-active' : ''}`}
              onClick={() => onOpen(c.id)}
            >
              {u ? (
                <Avatar user={u} status={effectiveStatus(u, onlineIds)} size={40} />
              ) : (
                <span className="vo-group-icon">{c.name.slice(0, 2).toUpperCase()}</span>
              )}
              <span className="vo-conv-text">
                <span className="vo-row">
                  <strong>{c.name}</strong>
                  <small>{timeOf(c.last_message?.created_at)}</small>
                </span>
                <span className="vo-row">
                  <span className="vo-ellipsis">{preview(c.last_message, me.id)}</span>
                  {c.unread > 0 && <b className="vo-badge">{c.unread}</b>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <>
          <div className="vo-thread-head">
            {peer ? (
              <Avatar user={peer} status={peerStatus} size={40} />
            ) : (
              <span className="vo-group-icon">{active.name.slice(0, 2).toUpperCase()}</span>
            )}
            <div>
              <strong>{active.name}</strong>
              <small>
                {peer
                  ? `${STATUS[peerStatus].label}${peer.zone ? ' · Zona ' + peer.zone : ''}${peer.profile?.bubble ? ' · ' + peer.profile.bubble : ''}`
                  : `${active.members_count} anggota · ${active.member_ids.filter((id) => onlineIds.has(id)).length} online`}
              </small>
            </div>
          </div>

          <div className="vo-messages" ref={listRef}>
            {thread?.hasMore && (
              <button type="button" className="vo-btn vo-btn-ghost vo-more" onClick={() => onLoadMore(active.id)}>
                Muat pesan sebelumnya
              </button>
            )}
            {!thread?.loaded && !thread?.error && <p className="vo-empty">Memuat…</p>}
            {thread?.error && <p className="vo-empty">Pesan gagal dimuat. Klik percakapan ini lagi di daftar untuk mencoba ulang.</p>}
            {thread?.loaded && thread.items.length === 0 && <p className="vo-empty">Belum ada pesan. Sapa duluan.</p>}
            {thread?.items.map((m) => {
              const mine = m.user_id === me.id;
              const sender = usersById[m.user_id];
              return (
                <div key={m.id} className={`vo-msg${mine ? ' is-mine' : ''}`}>
                  {!mine && active.type === 'group' && <span className="vo-msg-name">{sender?.name || m.user_name}</span>}
                  {m.body && <div className="vo-msg-body">{m.body}</div>}
                  {m.attachment &&
                    (m.attachment.is_image ? (
                      <a href={m.attachment.url} target="_blank" rel="noreferrer" className="vo-msg-image">
                        <img src={m.attachment.url} alt={m.attachment.name} loading="lazy" />
                      </a>
                    ) : (
                      <a href={m.attachment.url} className="vo-msg-file">
                        <b>{(m.attachment.name.split('.').pop() || 'FILE').toUpperCase()}</b>
                        <span>
                          {m.attachment.name}
                          <small>{sizeOf(m.attachment.size)}</small>
                        </span>
                      </a>
                    ))}
                  <small className="vo-msg-time">
                    {timeOf(m.created_at)}
                    {mine && active.type === 'personal' && active.peer_last_read_id >= m.id && ' · Dibaca'}
                  </small>
                </div>
              );
            })}
            {typing && <p className="vo-typing">{typing} sedang mengetik…</p>}
          </div>

          <form className="vo-compose" onSubmit={submit}>
            {file && (
              <div className="vo-file-chip">
                📎 {file.name}
                <button type="button" aria-label="Batalkan lampiran" onClick={() => { setFile(null); fileRef.current.value = ''; }}>×</button>
              </div>
            )}
            {error && <div className="vo-error">{error}</div>}
            <div className="vo-row">
              <label className="vo-icon-btn" aria-label="Lampirkan file">
                📎
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.xlsx,.xls,.csv,.docx,.doc,.pptx,.txt,.zip"
                />
              </label>
              <input
                type="text"
                value={text}
                maxLength={4000}
                placeholder="Tulis pesan…"
                aria-label="Tulis pesan"
                onChange={(e) => {
                  setText(e.target.value);
                  notifyTyping();
                  if (e.target.value.trim()) pingActivity(active.type);
                  else stopActivity();
                }}
              />
              <button type="submit" className="vo-btn vo-btn-primary" disabled={sending}>
                {sending ? '…' : 'Kirim'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <p className="vo-empty vo-grow">Pilih percakapan di atas.</p>
      )}

      {showGroup && (
        <GroupDialog
          me={me}
          usersById={usersById}
          onClose={() => setShowGroup(false)}
          onCreate={async (name, ids) => {
            await onCreateGroup(name, ids);
            setShowGroup(false);
          }}
        />
      )}
    </aside>
  );
}

function GroupDialog({ me, usersById, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const list = Object.values(usersById)
    .filter((u) => u.id !== me.id && u.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="vo-modal-backdrop" onClick={onClose}>
      <div className="vo-modal" role="dialog" aria-label="Buat grup" onClick={(e) => e.stopPropagation()}>
        <h3>Buat grup baru</h3>
        <label className="vo-field">
          Nama grup
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Tim Payroll" />
        </label>
        <label className="vo-field">
          Anggota ({picked.length})
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama…" />
        </label>
        <div className="vo-pick-list">
          {list.map((u) => (
            <label key={u.id} className="vo-pick">
              <input type="checkbox" checked={picked.includes(u.id)} onChange={() => toggle(u.id)} />
              <Avatar user={u} ring={false} size={28} />
              {u.name}
            </label>
          ))}
        </div>
        {error && <div className="vo-error">{error}</div>}
        <div className="vo-row vo-modal-actions">
          <button type="button" className="vo-btn" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="vo-btn vo-btn-primary"
            disabled={!name.trim() || picked.length === 0}
            onClick={() => onCreate(name.trim(), picked).catch((e) => setError(e.message))}
          >
            Buat grup
          </button>
        </div>
      </div>
    </div>
  );
}

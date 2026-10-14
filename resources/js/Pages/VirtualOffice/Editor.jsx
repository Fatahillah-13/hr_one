import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import FloorEditor from '../../VirtualOffice/editor/FloorEditor';
import OfficeFloor from '../../VirtualOffice/OfficeFloor';
import { buildScene } from '../../VirtualOffice/scene';
import {
  DESK_TEMPLATES, FACING_LABEL, FLOOR_H, FLOOR_W, OBJECT_TYPES, ZONE_LABEL_SIZES,
  autoZoneLabels, nextSeatCode, overlappingSeatKeys, rotateDesk, rotateObject,
} from '../../VirtualOffice/catalog';
import { BASE, api, errorText } from '../../VirtualOffice/api';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import '../../../css/virtual-office.css';

// ---------- konversi data server <-> editor ----------
let keySeq = 1;
const newKey = (p) => `${p}${keySeq++}`;
const seatFields = (s) => ({
  id: s.id ?? null, code: s.code, zone: s.zone, facing: s.facing || 'L', has_panel: !!s.has_panel,
  is_printer: !!s.is_printer, x: s.x, y: s.y, w: s.w, d: s.d, user_id: s.is_printer ? null : s.user_id ?? null,
});
const objFields = (o) => ({ type: o.type, x: o.x, y: o.y, w: o.w, d: o.d, rotation: o.rotation || 0, label: o.label ?? null });
// Denah lama belum punya objek "Tulisan zona": dibuat dari posisi otomatis supaya bisa langsung diedit.
const withZoneLabels = (seats, objects) => (objects.some((o) => o.type === 'zone_label') ? objects : [...objects, ...autoZoneLabels(seats)]);
const fromServer = (seats, objects) => ({
  seats: seats.map((s) => ({ ...seatFields(s), key: s.id ? `s${s.id}` : newKey('n') })),
  objects: withZoneLabels(seats, objects).map((o) => ({ ...objFields(o), key: newKey('o') })),
});
const toServer = (l) => ({ seats: l.seats.map(seatFields), objects: l.objects.map(objFields) });
const sameLayout = (a, b) => JSON.stringify(toServer(a)) === JSON.stringify(toServer(b));
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

export default function VirtualOfficeEditor({ seats, objects, users, draft, versions: initialVersions }) {
  const [published, setPublished] = useState(() => fromServer(seats, objects));
  const [layout, setLayout] = useState(published);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [selection, setSelection] = useState([]);
  const [view, setView] = useState({ x: -20, y: -20, w: FLOOR_W + 40, h: FLOOR_H + 40 });
  const [mode, setMode] = useState('2d');
  const [snap, setSnap] = useState(10);
  const [lockRooms, setLockRooms] = useState(true);
  const [zone, setZone] = useState('A');
  const [newZone, setNewZone] = useState('');
  const [draftInfo, setDraftInfo] = useState(draft);
  const [saveState, setSaveState] = useState({ busy: false, msg: '' });
  const [versions, setVersions] = useState(initialVersions || []);
  const [showVersions, setShowVersions] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [error, setError] = useState('');
  const [leaveWarned, setLeaveWarned] = useState(false);
  const dragBase = useRef(null);

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const zones = useMemo(() => [...new Set(layout.seats.map((s) => s.zone))].sort(), [layout.seats]);
  const zoneNames = useMemo(() => {
    const map = {};
    const labels = layout.objects.filter((o) => o.type === 'zone_label' && o.label);
    zones.forEach((z) => {
      const direct = labels.find((l) => new RegExp(`(^|\\b)ZONA\\s+${z}(\\b|$)`, 'i').test(l.label));
      if (direct) {
        map[z] = direct.label.replace(new RegExp(`(^|\\b)ZONA\\s+${z}\\s*[:-]?\\s*`, 'i'), '').trim() || direct.label;
        return;
      }
      const zoneSeats = layout.seats.filter((s) => s.zone === z);
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
  }, [zones, layout.seats, layout.objects]);
  const overlaps = useMemo(() => overlappingSeatKeys(layout.seats), [layout.seats]);
  const dirty = !sameLayout(layout, published);
  const seated = new Set(layout.seats.map((s) => s.user_id).filter(Boolean));
  const unseated = users.filter((u) => !seated.has(u.id));

  // ---------- riwayat undo/redo ----------
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const commit = (next) => {
    const cur = layoutRef.current;
    const n = typeof next === 'function' ? next(cur) : next;
    layoutRef.current = n;
    setPast((p) => [...p.slice(-59), cur]);
    setFuture([]);
    setLayout(n);
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [layout, ...f]);
    setLayout(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, layout]);
    setLayout(future[0]);
    setFuture((f) => f.slice(1));
  };

  // ---------- operasi pada pilihan ----------
  const selected = selection.map((s) =>
    s.kind === 'seat' ? { ...s, item: layout.seats.find((x) => x.key === s.key) } : { ...s, item: layout.objects.find((x) => x.key === s.key) },
  ).filter((s) => s.item);

  const patchItems = (l, keys, fn) => ({
    seats: l.seats.map((s) => (keys.seat.has(s.key) ? fn(s, 'seat') : s)),
    objects: l.objects.map((o) => (keys.object.has(o.key) ? fn(o, 'object') : o)),
  });
  const keySets = (sel) => ({
    seat: new Set(sel.filter((s) => s.kind === 'seat').map((s) => s.key)),
    object: new Set(sel.filter((s) => s.kind === 'object').map((s) => s.key)),
  });

  const moveBy = (sel, dx, dy, base) => {
    const ks = keySets(sel);
    setLayout(patchItems(base, ks, (it) => ({ ...it, x: it.x + dx, y: it.y + dy })));
  };

  const removeSelection = () => {
    if (!selection.length) return;
    const ks = keySets(selection);
    commit((l) => ({ seats: l.seats.filter((s) => !ks.seat.has(s.key)), objects: l.objects.filter((o) => !ks.object.has(o.key)) }));
    setSelection([]);
  };

  const rotateSelection = () => {
    if (!selection.length) return;
    const ks = keySets(selection);
    commit((l) => patchItems(l, ks, (it, kind) => (kind === 'seat' ? rotateDesk(it) : rotateObject(it))));
  };

  const duplicateSelection = () => {
    if (!selection.length) return;
    const ks = keySets(selection);
    const newSel = [];
    commit((l) => {
      const taken = [];
      const seatsCopy = l.seats.filter((s) => ks.seat.has(s.key)).map((s) => {
        const code = nextSeatCode(l.seats, s.zone, taken);
        taken.push(code);
        const key = newKey('n');
        newSel.push({ kind: 'seat', key });
        return { ...s, id: null, key, code, user_id: null, x: s.x + 20, y: s.y + 20 };
      });
      const objsCopy = l.objects.filter((o) => ks.object.has(o.key)).map((o) => {
        const key = newKey('o');
        newSel.push({ kind: 'object', key });
        return { ...o, key, x: o.x + 20, y: o.y + 20 };
      });
      return { seats: [...l.seats, ...seatsCopy], objects: [...l.objects, ...objsCopy] };
    });
    setSelection(newSel);
  };

  const nudge = (dx, dy) => {
    if (!selection.length) return;
    commit((l) => patchItems(l, keySets(selection), (it) => ({ ...it, x: it.x + dx, y: it.y + dy })));
  };

  const updateSeat = (key, patch) => commit((l) => {
    let seats2 = l.seats;
    // karyawan hanya boleh di satu meja: lepas dari meja lama
    if (patch.user_id) seats2 = seats2.map((s) => (s.key !== key && s.user_id === patch.user_id ? { ...s, user_id: null } : s));
    return { ...l, seats: seats2.map((s) => (s.key === key ? { ...s, ...patch } : s)) };
  });
  const updateObject = (key, patch) => commit((l) => ({ ...l, objects: l.objects.map((o) => (o.key === key ? { ...o, ...patch } : o)) }));

  const viewCenter = () => ({ x: Math.round(view.x + view.w / 2), y: Math.round(view.y + view.h / 2) });

  const addDesks = (tplKey) => {
    const tpl = DESK_TEMPLATES[tplKey];
    const z = (newZone.trim() || zone || 'A').toUpperCase().slice(0, 10);
    const c = viewCenter();
    const sel = [];
    commit((l) => {
      const taken = [];
      const add = tpl.desks.map((d) => {
        const code = nextSeatCode(l.seats, z, taken);
        taken.push(code);
        const key = newKey('n');
        sel.push({ kind: 'seat', key });
        return {
          id: null, key, code, zone: z, facing: d.facing, has_panel: d.has_panel, is_printer: false,
          x: Math.round((c.x - 36 + d.dx) / 10) * 10, y: Math.round((c.y - 40 + d.dy) / 10) * 10, w: d.w, d: d.d, user_id: null,
        };
      });
      return { ...l, seats: [...l.seats, ...add] };
    });
    setZone(z);
    setNewZone('');
    setSelection(sel);
  };

  const addObject = (type) => {
    const t = OBJECT_TYPES[type];
    const c = viewCenter();
    const key = newKey('o');
    commit((l) => ({
      ...l,
      objects: [...l.objects, {
        key, type, w: t.w, d: t.d, rotation: 0,
        label: type === 'zone_label' ? `ZONA ${zone}` : t.labelled ? t.defaultLabel : null,
        x: Math.round((c.x - t.w / 2) / 10) * 10, y: Math.round((c.y - t.d / 2) / 10) * 10,
      }],
    }));
    setSelection([{ kind: 'object', key }]);
    if (type === 'room') setLockRooms(false);
  };

  // ---------- simpan, publikasi, versi ----------
  const saveDraft = async () => {
    setSaveState({ busy: true, msg: 'Menyimpan draft…' });
    setError('');
    try {
      const r = await api.saveDraft(toServer(layout));
      setDraftInfo({ layout: toServer(layout), saved_at: r.saved_at, by: 'kamu' });
      setSaveState({ busy: false, msg: `Draft tersimpan ${fmt(r.saved_at)}` });
    } catch (e) {
      setSaveState({ busy: false, msg: '' });
      setError(errorText(e));
    }
  };

  const publish = async (note) => {
    setSaveState({ busy: true, msg: 'Mempublikasikan…' });
    setError('');
    try {
      const r = await api.publish(toServer(layout), note);
      const fresh = fromServer(r.seats, r.objects);
      setPublished(fresh);
      setLayout(fresh);
      setPast([]);
      setFuture([]);
      setSelection([]);
      setVersions(r.versions);
      setDraftInfo(null);
      setPublishOpen(false);
      setSaveState({ busy: false, msg: 'Denah dipublikasikan. Semua karyawan sudah melihat perubahan.' });
    } catch (e) {
      setSaveState({ busy: false, msg: '' });
      setError(errorText(e));
      setPublishOpen(false);
    }
  };

  const loadLayout = (l, msg) => {
    commit(fromServer(l.seats, l.objects));
    setSelection([]);
    setSaveState({ busy: false, msg });
  };

  const openVersion = async (v) => {
    setShowVersions(false);
    try {
      const l = await api.version(v.id);
      loadLayout(l, `Versi ${fmt(v.at)} dibuka. Publikasikan untuk menerapkannya.`);
    } catch (e) {
      setError(errorText(e));
    }
  };

  // ---------- pintasan keyboard ----------
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e.target) || mode !== '2d') return;
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (ctrl && k === 'd') { e.preventDefault(); duplicateSelection(); }
      else if (k === 'delete' || k === 'backspace') { e.preventDefault(); removeSelection(); }
      else if (k === 'r') rotateSelection();
      else if (k === 'escape') setSelection([]);
      else if (k.startsWith('arrow')) {
        e.preventDefault();
        const st = e.shiftKey ? 10 : 1;
        nudge(k === 'arrowleft' ? -st : k === 'arrowright' ? st : 0, k === 'arrowup' ? -st : k === 'arrowdown' ? st : 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // peringatan saat meninggalkan halaman dengan perubahan belum dipublikasikan
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  // ---------- pratinjau 3D ----------
  const preview = useMemo(() => {
    if (mode !== '3d') return null;
    const sv = toServer(layout).seats;
    const scene = buildScene(sv, toServer(layout).objects);
    const people = layout.seats.filter((s) => s.user_id && usersById[s.user_id]).map((s) => ({ ...usersById[s.user_id], seat_code: s.code, zone: s.zone, profile: {} }));
    return { scene, people, online: new Set(people.map((p) => p.id)) };
  }, [mode, layout, usersById]);

  const diff = useMemo(() => {
    const before = new Map(published.seats.map((s) => [s.id, s]));
    const added = layout.seats.filter((s) => !s.id || !before.has(s.id)).length;
    const keep = new Set(layout.seats.map((s) => s.id).filter(Boolean));
    const removed = published.seats.filter((s) => !keep.has(s.id)).length;
    const changed = layout.seats.filter((s) => s.id && before.has(s.id) && JSON.stringify(seatFields(s)) !== JSON.stringify(seatFields(before.get(s.id)))).length;
    const objChanged = JSON.stringify(layout.objects.map(objFields)) !== JSON.stringify(published.objects.map(objFields));
    return { added, removed, changed, objChanged };
  }, [layout, published]);

  const one = selected.length === 1 ? selected[0] : null;

  return (
    <AuthenticatedLayout>
    <div className="vo-app vo-editor">
      <Head title="Editor Denah" />

      <header className="vo-header">
        <a
          className="vo-btn"
          href={BASE}
          onClick={(e) => {
            if (dirty && !leaveWarned) {
              e.preventDefault();
              setLeaveWarned(true);
              setError('Ada perubahan yang belum dipublikasikan. Simpan draft atau publikasikan dulu, atau klik Keluar sekali lagi untuk tetap keluar.');
            }
          }}
        >
          ← Keluar
        </a>
        <div className="vo-brand">
          <div>
            <strong>Editor denah</strong>
            <small>Khusus admin HRD · perubahan tampil setelah dipublikasikan</small>
          </div>
        </div>
        <span className="vo-grow" />
        <button type="button" className="vo-icon-btn" onClick={undo} disabled={!past.length} aria-label="Urungkan (Ctrl+Z)" title="Urungkan (Ctrl+Z)">↶</button>
        <button type="button" className="vo-icon-btn" onClick={redo} disabled={!future.length} aria-label="Ulangi (Ctrl+Y)" title="Ulangi (Ctrl+Y)">↷</button>
        <div className="vo-tabs vo-ed-mode" role="tablist" aria-label="Tampilan">
          <button type="button" role="tab" aria-selected={mode === '2d'} onClick={() => setMode('2d')}>Edit 2D</button>
          <button type="button" role="tab" aria-selected={mode === '3d'} onClick={() => setMode('3d')}>Pratinjau 3D</button>
        </div>
        <div className="vo-ed-versions">
          <button type="button" className="vo-btn" onClick={() => setShowVersions((v) => !v)} aria-expanded={showVersions}>Riwayat</button>
          {showVersions && (
            <div className="vo-menu vo-ed-version-menu" role="menu">
              <span className="vo-menu-title">VERSI YANG PERNAH DIPUBLIKASIKAN</span>
              {versions.length === 0 && <span className="vo-empty">Belum ada.</span>}
              {versions.map((v) => (
                <button key={v.id} type="button" role="menuitem" onClick={() => openVersion(v)}>
                  <span>{fmt(v.at)}{v.note ? ` · ${v.note}` : ''}</span>
                  <small>{v.by || ''}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className={`vo-ed-status${dirty ? ' is-dirty' : ''}`}>{saveState.msg || (dirty ? 'Ada perubahan belum dipublikasikan' : 'Sama dengan denah aktif')}</span>
        <button type="button" className="vo-btn" onClick={saveDraft} disabled={saveState.busy || !dirty}>Simpan draft</button>
        <button type="button" className="vo-btn vo-btn-primary" onClick={() => setPublishOpen(true)} disabled={saveState.busy || !dirty}>Publikasikan</button>
      </header>

      {draftInfo && sameLayout(layout, published) && (
        <div className="vo-ed-banner" role="status">
          Ada draft tersimpan {fmt(draftInfo.saved_at)}{draftInfo.by ? ` oleh ${draftInfo.by}` : ''}.
          <button type="button" className="vo-btn vo-btn-ghost" onClick={() => loadLayout(draftInfo.layout, 'Draft dibuka.')}>Buka draft</button>
          <button type="button" className="vo-btn vo-btn-ghost" onClick={() => setDraftInfo(null)}>Abaikan</button>
        </div>
      )}
      {error && (
        <div className="vo-ed-banner is-error" role="alert">
          {error}
          <button type="button" className="vo-btn vo-btn-ghost" onClick={() => setError('')}>Tutup</button>
        </div>
      )}

      <main className="vo-main vo-ed-main">
        {/* ---------------- palet ---------------- */}
        <nav className="vo-ed-side" aria-label="Tambah ke denah">
          <section>
            <h2>Tambah meja</h2>
            <label className="vo-field">
              Zona untuk meja baru
              <span className="vo-row">
                <select value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zona">
                  {(zones.length ? zones : ['A']).map((z) => (
                    <option key={z} value={z}>
                      {zoneNames[z] ? `${z} - ${zoneNames[z]}` : `Zona ${z}`}
                    </option>
                  ))}
                </select>
                <input value={newZone} maxLength={10} onChange={(e) => setNewZone(e.target.value.toUpperCase())} placeholder="Zona baru" aria-label="Zona baru" />
              </span>
            </label>
            {Object.entries(DESK_TEMPLATES).map(([k, t]) => (
              <button key={k} type="button" className="vo-ed-palette" onClick={() => addDesks(k)}>
                <i className="vo-ed-swatch is-desk" />
                <span><strong>{t.name}</strong><small>{t.desc}</small></span>
              </button>
            ))}
          </section>
          {['Ruangan', 'Perabot', 'Peralatan'].map((g) => (
            <section key={g}>
              <h2>{g}</h2>
              <div className="vo-ed-grid">
                {Object.entries(OBJECT_TYPES).filter(([, t]) => t.group === g).map(([k, t]) => (
                  <button key={k} type="button" className="vo-ed-palette is-small" onClick={() => addObject(k)}>
                    <i className="vo-ed-swatch" style={{ background: t.color2d === 'transparent' ? '#F3EEE6' : t.color2d }} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <section>
            <h2>Belum punya meja ({unseated.length})</h2>
            <p className="vo-ed-hint">Pilih satu meja kosong, lalu klik nama di bawah untuk menempatkannya.</p>
            <div className="vo-ed-unseated">
              {unseated.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={!(one && one.kind === 'seat' && !one.item.is_printer)}
                  onClick={() => updateSeat(one.key, { user_id: u.id })}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </section>
        </nav>

        {/* ---------------- kanvas ---------------- */}
        <section className="vo-floor-card vo-ed-canvas">
          {mode === '2d' ? (
            <>
              <div className="vo-floor-top">
                <label className="vo-row vo-ed-check"><input type="checkbox" checked={!!snap} onChange={(e) => setSnap(e.target.checked ? 10 : 0)} /> Snap ke grid</label>
                <label className="vo-row vo-ed-check"><input type="checkbox" checked={lockRooms} onChange={(e) => setLockRooms(e.target.checked)} /> Kunci ruangan</label>
                <span className="vo-grow" />
                <span className="vo-ed-stats">
                  {layout.seats.length} meja · {layout.seats.filter((s) => s.user_id).length} terisi ·{' '}
                  {layout.seats.filter((s) => !s.user_id && !s.is_printer).length} kosong
                  {overlaps.size > 0 && <b> · {overlaps.size} bertumpuk</b>}
                </span>
                <button type="button" className="vo-btn" onClick={() => setView({ x: -20, y: -20, w: FLOOR_W + 40, h: FLOOR_H + 40 })}>Lihat semua</button>
              </div>
              <FloorEditor
                layout={layout}
                usersById={usersById}
                selection={selection}
                overlaps={overlaps}
                snap={snap}
                lockRooms={lockRooms}
                view={view}
                onView={setView}
                onSelect={setSelection}
                onDragStart={() => { dragBase.current = layout; }}
                onDragMove={(sel, dx, dy) => moveBy(sel, dx, dy, dragBase.current)}
                onDragEnd={() => {
                  setPast((p) => [...p.slice(-59), dragBase.current]);
                  setFuture([]);
                  dragBase.current = null;
                }}
              />
              <div className="vo-legend">
                <span className="vo-legend-hint">
                  Klik: pilih · Shift+klik: pilih banyak · Seret: pindah · Seret area kosong: geser · Scroll: zoom ·
                  R: putar · Ctrl+D: duplikat · Delete: hapus · Panah: geser halus · Ctrl+Z: urungkan
                </span>
              </div>
            </>
          ) : (
            <OfficeFloor
              scene={preview.scene}
              people={preview.people}
              onlineIds={preview.online}
              zone="all"
              selectedId={null}
              onSelect={() => {}}
              onChat={() => {}}
              meId={null}
            />
          )}
        </section>

        {/* ---------------- properti ---------------- */}
        <aside className="vo-ed-side vo-ed-props" aria-label="Properti">
          {selected.length === 0 && (
            <section>
              <h2>Belum ada yang dipilih</h2>
              <p className="vo-ed-hint">Klik meja atau perabot di denah untuk mengatur posisi, arah, dan karyawannya.</p>
              <h2>Pilih per zona</h2>
              <div className="vo-chips">
                {zones.map((z) => (
                  <button key={z} type="button" onClick={() => setSelection(layout.seats.filter((s) => s.zone === z).map((s) => ({ kind: 'seat', key: s.key })))}>
                    {zoneNames[z] ? `${z} - ${zoneNames[z]}` : `Zona ${z}`}
                  </button>
                ))}
              </div>
              <p className="vo-ed-hint">Memilih satu zona memudahkan memindahkan seluruh kelompok meja sekaligus.</p>
            </section>
          )}

          {selected.length > 1 && (
            <section>
              <h2>{selected.length} item dipilih</h2>
              <p className="vo-ed-hint">Seret salah satunya untuk memindahkan semua.</p>
              <SelActions onRotate={rotateSelection} onDuplicate={duplicateSelection} onDelete={removeSelection} />
            </section>
          )}

          {one && one.kind === 'seat' && (
            <SeatProps
              s={one.item}
              users={users}
              seatOf={(uid) => layout.seats.find((x) => x.user_id === uid && x.key !== one.key)?.code}
              overlap={overlaps.has(one.key)}
              onChange={(p) => updateSeat(one.key, p)}
              onRotate={rotateSelection}
              onDuplicate={duplicateSelection}
              onDelete={removeSelection}
            />
          )}

          {one && one.kind === 'object' && (
            <ObjectProps
              o={one.item}
              onChange={(p) => updateObject(one.key, p)}
              onRotate={rotateSelection}
              onDuplicate={duplicateSelection}
              onDelete={removeSelection}
            />
          )}
        </aside>
      </main>

      {publishOpen && (
        <PublishDialog diff={diff} overlaps={overlaps.size} busy={saveState.busy} onCancel={() => setPublishOpen(false)} onConfirm={publish} />
      )}
    </div>
    </AuthenticatedLayout>
  );
}

function NumberField({ label, value, onChange, min, max }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const apply = () => {
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n !== value) onChange(Math.min(max ?? 9999, Math.max(min ?? -9999, n)));
    else setV(String(value));
  };
  return (
    <label className="vo-field">
      {label}
      <input type="number" value={v} onChange={(e) => setV(e.target.value)} onBlur={apply} onKeyDown={(e) => e.key === 'Enter' && apply()} />
    </label>
  );
}

function SelActions({ onRotate, onDuplicate, onDelete }) {
  return (
    <div className="vo-ed-actions">
      <button type="button" className="vo-btn" onClick={onRotate}>Putar 90°</button>
      <button type="button" className="vo-btn" onClick={onDuplicate}>Duplikat</button>
      <button type="button" className="vo-btn vo-btn-danger" onClick={onDelete}>Hapus</button>
    </div>
  );
}

function SeatProps({ s, users, seatOf, overlap, onChange, onRotate, onDuplicate, onDelete }) {
  const [code, setCode] = useState(s.code);
  const [zone, setZone] = useState(s.zone);
  useEffect(() => { setCode(s.code); setZone(s.zone); }, [s.code, s.zone]);

  return (
    <section>
      <h2>Meja {s.code}</h2>
      {overlap && <div className="vo-error">Meja ini bertumpuk dengan meja lain. Geser sampai garis merahnya hilang.</div>}
      <div className="vo-ed-two">
        <label className="vo-field">
          Kode meja
          <input value={code} maxLength={20} onChange={(e) => setCode(e.target.value.toUpperCase())} onBlur={() => code.trim() && code !== s.code && onChange({ code: code.trim() })} />
        </label>
        <label className="vo-field">
          Zona
          <input value={zone} maxLength={10} onChange={(e) => setZone(e.target.value.toUpperCase())} onBlur={() => zone.trim() && zone !== s.zone && onChange({ zone: zone.trim() })} />
        </label>
      </div>

      <label className="vo-field">
        Karyawan
        <select value={s.user_id ?? ''} disabled={s.is_printer} onChange={(e) => onChange({ user_id: e.target.value ? Number(e.target.value) : null })}>
          <option value="">— Kosong —</option>
          {users.map((u) => {
            const other = seatOf(u.id);
            return <option key={u.id} value={u.id}>{u.name}{other ? ` (pindah dari ${other})` : ''}</option>;
          })}
        </select>
      </label>

      <div className="vo-field">
        Karyawan duduk di sisi
        <div className="vo-chips" role="radiogroup" aria-label="Sisi duduk">
          {Object.entries(FACING_LABEL).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={s.facing === k} className={s.facing === k ? 'is-on' : ''} onClick={() => onChange({ facing: k })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <label className="vo-row vo-ed-check"><input type="checkbox" checked={s.has_panel} onChange={(e) => onChange({ has_panel: e.target.checked })} /> Partisi di belakang monitor</label>
      <label className="vo-row vo-ed-check"><input type="checkbox" checked={s.is_printer} onChange={(e) => onChange({ is_printer: e.target.checked, user_id: e.target.checked ? null : s.user_id })} /> Meja printer (tanpa kursi)</label>

      <div className="vo-ed-two">
        <NumberField label="X" value={s.x} onChange={(x) => onChange({ x })} min={-100} max={1200} />
        <NumberField label="Y" value={s.y} onChange={(y) => onChange({ y })} min={-100} max={800} />
        <NumberField label="Lebar" value={s.w} onChange={(w) => onChange({ w })} min={20} max={200} />
        <NumberField label="Dalam" value={s.d} onChange={(d) => onChange({ d })} min={20} max={200} />
      </div>
      <SelActions onRotate={onRotate} onDuplicate={onDuplicate} onDelete={onDelete} />
    </section>
  );
}

function ObjectProps({ o, onChange, onRotate, onDuplicate, onDelete }) {
  const t = OBJECT_TYPES[o.type] || { name: o.type };
  const [label, setLabel] = useState(o.label || '');
  useEffect(() => setLabel(o.label || ''), [o.label]);
  return (
    <section>
      <h2>{t.name}</h2>
      {t.labelled && (
        <label className="vo-field">
          {o.type === 'zone_label' ? 'Tulisan' : 'Label'}
          <input
            value={label}
            maxLength={40}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => label !== (o.label || '') && onChange({ label: label || null })}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </label>
      )}
      {o.type === 'zone_label' && (
        <div className="vo-field">
          Ukuran huruf
          <div className="vo-chips" role="radiogroup">
            {ZONE_LABEL_SIZES.map(([name, d]) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={o.d === d}
                className={o.d === d ? 'is-on' : ''}
                onClick={() => onChange({ d, y: Math.round(o.y + (o.d - d) / 2), w: Math.max(o.w, Math.round(d * 3)), x: o.w >= d * 3 ? o.x : Math.round(o.x + (o.w - d * 3) / 2) })}
              >
                {name}
              </button>
            ))}
          </div>
          <small className="vo-ed-hint">Geser kotaknya untuk memindahkan tulisan. Tulisan zona tidak ikut pindah saat meja digeser.</small>
        </div>
      )}
      {t.rotatable && (
        <div className="vo-field">
          Sisi belakang
          <div className="vo-chips" role="radiogroup">
            {[[0, 'Atas'], [90, 'Kanan'], [180, 'Bawah'], [270, 'Kiri']].map(([r, l]) => (
              <button key={r} type="button" role="radio" aria-checked={(o.rotation || 0) === r} className={(o.rotation || 0) === r ? 'is-on' : ''} onClick={() => onChange({ rotation: r })}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="vo-ed-two">
        <NumberField label="X" value={o.x} onChange={(x) => onChange({ x })} min={-100} max={1200} />
        <NumberField label="Y" value={o.y} onChange={(y) => onChange({ y })} min={-100} max={800} />
        <NumberField label="Lebar" value={o.w} onChange={(w) => onChange({ w })} min={2} max={1200} />
        <NumberField label="Dalam" value={o.d} onChange={(d) => onChange({ d })} min={2} max={1200} />
      </div>
      <SelActions onRotate={onRotate} onDuplicate={onDuplicate} onDelete={onDelete} />
    </section>
  );
}

function PublishDialog({ diff, overlaps, busy, onCancel, onConfirm }) {
  const [note, setNote] = useState('');
  const lines = [
    diff.added && `${diff.added} meja baru`,
    diff.removed && `${diff.removed} meja dihapus`,
    diff.changed && `${diff.changed} meja diubah (posisi, arah, atau karyawan)`,
    diff.objChanged && 'Ruangan atau perabot berubah',
  ].filter(Boolean);
  return (
    <div className="vo-modal-backdrop" onClick={onCancel}>
      <div className="vo-modal" role="dialog" aria-label="Publikasikan denah" onClick={(e) => e.stopPropagation()}>
        <h3>Publikasikan denah?</h3>
        <p className="vo-ed-hint">Semua karyawan yang sedang membuka Virtual Office langsung melihat denah baru. Versi sekarang tetap tersimpan di Riwayat.</p>
        <ul className="vo-ed-diff">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
        {overlaps > 0 && <div className="vo-error">{overlaps} meja masih bertumpuk. Denah tetap bisa dipublikasikan, tapi sebaiknya dirapikan dulu.</div>}
        <label className="vo-field">
          Catatan (opsional)
          <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Tambah 2 meja Zona C untuk karyawan baru" />
        </label>
        <div className="vo-row vo-modal-actions">
          <span className="vo-grow" />
          <button type="button" className="vo-btn" onClick={onCancel}>Batal</button>
          <button type="button" className="vo-btn vo-btn-primary" disabled={busy} onClick={() => onConfirm(note.trim() || null)}>
            {busy ? 'Mempublikasikan…' : 'Publikasikan'}
          </button>
        </div>
      </div>
    </div>
  );
}

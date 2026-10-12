import React, { useEffect, useRef } from 'react';
import { FLOOR_H, FLOOR_W, OBJECT_TYPES, deriveSeat, zoneLabelSize } from '../catalog';

/**
 * Kanvas editor 2D (tampak atas) berbasis SVG.
 * - klik: pilih · Shift+klik: tambah ke pilihan · seret: pindahkan semua yang dipilih
 * - seret area kosong: geser tampilan · scroll: zoom
 */
export default function FloorEditor({ layout, usersById, selection, overlaps, snap, lockRooms, view, onView, onSelect, onDragStart, onDragMove, onDragEnd }) {
  const svgRef = useRef(null);
  const drag = useRef(null);

  const toFloor = (e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  };
  const snapTo = (v) => (snap ? Math.round(v / snap) * snap : Math.round(v));
  const isSel = (kind, key) => selection.some((s) => s.kind === kind && s.key === key);

  // zoom dengan scroll, berpusat di posisi kursor
  useEffect(() => {
    const svg = svgRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const p = toFloor(e);
      const f = e.deltaY < 0 ? 0.88 : 1 / 0.88;
      onView((v) => {
        const w = Math.min(2400, Math.max(220, v.w * f));
        const h = (w * v.h) / v.w;
        return { x: p.x - ((p.x - v.x) * w) / v.w, y: p.y - ((p.y - v.y) * h) / v.h, w, h };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [onView]); // eslint-disable-line react-hooks/exhaustive-deps

  const startItem = (e, kind, key) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    svgRef.current.setPointerCapture(e.pointerId);
    let sel = selection;
    if (e.shiftKey) {
      sel = isSel(kind, key) ? selection.filter((s) => !(s.kind === kind && s.key === key)) : [...selection, { kind, key }];
      onSelect(sel);
      if (!sel.length) return;
    } else if (!isSel(kind, key)) {
      sel = [{ kind, key }];
      onSelect(sel);
    }
    drag.current = { mode: 'move', start: toFloor(e), sel, moved: false };
  };

  const startPan = (e) => {
    svgRef.current.setPointerCapture(e.pointerId);
    drag.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, view, moved: false };
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'pan') {
      const rect = svgRef.current.getBoundingClientRect();
      const k = d.view.w / rect.width;
      const dx = (e.clientX - d.sx) * k;
      const dy = (e.clientY - d.sy) * k;
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
      onView({ ...d.view, x: d.view.x - dx, y: d.view.y - dy });
      return;
    }
    const p = toFloor(e);
    const dx = snapTo(p.x - d.start.x);
    const dy = snapTo(p.y - d.start.y);
    if (!d.moved && (dx || dy)) {
      d.moved = true;
      onDragStart();
    }
    if (d.moved) onDragMove(d.sel, dx, dy);
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.mode === 'pan' && !d.moved) onSelect([]);
    if (d.mode === 'move' && d.moved) onDragEnd();
  };

  const rooms = layout.objects.filter((o) => o.type === 'room');
  const others = layout.objects.filter((o) => o.type !== 'room');

  return (
    <svg
      ref={svgRef}
      className="vo-ed-svg"
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      onPointerDown={startPan}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="application"
      aria-label="Editor denah tampak atas"
    >
      <defs>
        <pattern id="vo-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="rgba(120,100,70,0.13)" strokeWidth="0.6" />
        </pattern>
        <pattern id="vo-grid50" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0H0V50" fill="none" stroke="rgba(120,100,70,0.22)" strokeWidth="0.9" />
        </pattern>
      </defs>

      <rect x="0" y="0" width={FLOOR_W} height={FLOOR_H} fill="#E3DDD3" />
      {rooms.map((o) => (
        <ObjectShape
          key={o.key}
          o={o}
          locked={lockRooms}
          selected={isSel('object', o.key)}
          onDown={(e) => startItem(e, 'object', o.key)}
        />
      ))}
      <rect x="0" y="0" width={FLOOR_W} height={FLOOR_H} fill="url(#vo-grid)" pointerEvents="none" />
      <rect x="0" y="0" width={FLOOR_W} height={FLOOR_H} fill="url(#vo-grid50)" pointerEvents="none" />
      <rect x="0" y="0" width={FLOOR_W} height={FLOOR_H} fill="none" stroke="#B8AE9F" strokeWidth="2" strokeDasharray="8 6" pointerEvents="none" />

      {others.map((o) => (
        <ObjectShape key={o.key} o={o} selected={isSel('object', o.key)} onDown={(e) => startItem(e, 'object', o.key)} />
      ))}

      {layout.seats.map((s) => (
        <DeskShape
          key={s.key}
          s={s}
          user={s.user_id ? usersById[s.user_id] : null}
          selected={isSel('seat', s.key)}
          overlap={overlaps.has(s.key)}
          onDown={(e) => startItem(e, 'seat', s.key)}
        />
      ))}
    </svg>
  );
}

function DeskShape({ s, user, selected, overlap, onDown }) {
  const d = deriveSeat(s);
  const { x, y, w } = s;
  const h = s.d;
  const mon = {
    right: [x + w - 9, y + 6, 3, h - 12],
    left: [x + 6, y + 6, 3, h - 12],
    top: [x + 8, y + h - 9, w - 16, 3],
    bottom: [x + 8, y + 6, w - 16, 3],
  }[d.monitor];
  const panel = {
    xr: [x + w - 2, y, 3, h],
    xl: [x - 1, y, 3, h],
    yb: [x, y + h - 2, w, 3],
    yt: [x, y - 1, w, 3],
  }[d.panel];
  const name = s.is_printer ? 'Printer' : user ? user.name : 'Kosong';

  return (
    <g onPointerDown={onDown} className="vo-ed-item" style={{ cursor: 'move' }}>
      {d.seat_x != null && (
        <circle cx={d.seat_x} cy={d.seat_y} r="8" fill={user ? '#3D8389' : '#B9C7C8'} stroke="#285C61" strokeWidth="1" />
      )}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        fill={s.is_printer ? '#D5D9DD' : user ? '#EED9B6' : '#FBF3E4'}
        stroke={overlap ? '#D2453B' : '#B9945C'}
        strokeWidth={overlap ? 2.4 : 1}
        strokeDasharray={!user && !s.is_printer ? '4 3' : undefined}
      />
      {panel && <rect x={panel[0]} y={panel[1]} width={panel[2]} height={panel[3]} fill="#7E9A8F" />}
      {mon && <rect x={mon[0]} y={mon[1]} width={mon[2]} height={mon[3]} fill="#262D33" />}
      <text x={x + w / 2} y={y + h / 2 - 3} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#3A2A14" pointerEvents="none">
        {name.length > Math.floor(w / 5) ? name.slice(0, Math.floor(w / 5) - 1) + '…' : name}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fontSize="7" fill="#7A6A52" pointerEvents="none">
        {s.code}
      </text>
      {selected && (
        <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx="4" fill="none" stroke="#3D5EF0" strokeWidth="2" strokeDasharray="5 3" pointerEvents="none" />
      )}
    </g>
  );
}

function ObjectShape({ o, selected, onDown, locked = false }) {
  const t = OBJECT_TYPES[o.type] || { color2d: '#ccc', name: o.type };
  const { x, y, w, d } = o;
  const r = o.rotation || 0;
  const strip = (th) => (r === 90 ? [x + w - th, y, th, d] : r === 180 ? [x, y + d - th, w, th] : r === 270 ? [x, y, th, d] : [x, y, w, th]);
  let body;

  switch (o.type) {
    case 'room':
      body = <rect x={x} y={y} width={w} height={d} fill="#F3E3C6" stroke="#CFC4B3" strokeWidth="6" />;
      break;
    case 'plant':
      body = <circle cx={x + w / 2} cy={y + d / 2} r={Math.min(w, d) / 2} fill="#6FAF5C" stroke="#4E8540" />;
      break;
    case 'text':
      body = (
        <>
          <rect x={x} y={y} width={w} height={d} fill="transparent" stroke={selected ? 'none' : 'rgba(120,100,70,0.35)'} strokeDasharray="3 3" />
          <text x={x + w / 2} y={y + d / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#8F8273" letterSpacing="2" pointerEvents="none">
            {o.label}
          </text>
        </>
      );
      break;
    case 'zone_label':
      body = (
        <>
          <rect x={x} y={y} width={w} height={d} fill="rgba(184,160,126,0.06)" stroke={selected ? 'none' : 'rgba(184,160,126,0.55)'} strokeDasharray="4 3" />
          <text x={x + w / 2} y={y + d / 2} dominantBaseline="central" textAnchor="middle" fontSize={zoneLabelSize(d) * 0.85} fontWeight="800" fill="#B8A07E" letterSpacing="2" pointerEvents="none">
            {o.label}
          </text>
        </>
      );
      break;
    case 'meeting_table': {
      const along = w >= d;
      const n = Math.max(1, Math.floor(((along ? w : d) - 10) / 45));
      const chairs = [];
      for (let i = 0; i < n; i++) {
        if (along) {
          const cx = x + (w * (i + 0.5)) / n;
          chairs.push([cx, y - 14], [cx, y + d + 14]);
        } else {
          const cy = y + (d * (i + 0.5)) / n;
          chairs.push([x - 14, cy], [x + w + 14, cy]);
        }
      }
      body = (
        <>
          {chairs.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="7" fill="#B9C7C8" stroke="#285C61" strokeWidth="0.8" />)}
          <rect x={x} y={y} width={w} height={d} rx="8" fill="#FFFFFF" stroke="#9C8F7C" strokeWidth="1.5" />
        </>
      );
      break;
    }
    case 'sofa':
    case 'whiteboard': {
      const s = strip(o.type === 'sofa' ? 8 : 4);
      body = (
        <>
          <rect x={x} y={y} width={w} height={d} rx="3" fill={t.color2d} stroke={o.type === 'sofa' ? '#B0581F' : '#9AA1A8'} />
          <rect x={s[0]} y={s[1]} width={s[2]} height={s[3]} fill={o.type === 'sofa' ? '#B0581F' : '#5F6870'} />
        </>
      );
      break;
    }
    default:
      body = <rect x={x} y={y} width={w} height={d} rx="2" fill={t.color2d} stroke="rgba(40,40,40,0.35)" />;
  }

  const showName = !['room', 'text', 'zone_label', 'plant', 'wall', 'glass'].includes(o.type) && Math.min(w, d) >= 20;
  const caption = o.label || t.name;

  if (locked) return <g pointerEvents="none">{body}</g>;

  return (
    <g onPointerDown={onDown} className="vo-ed-item" style={{ cursor: 'move' }}>
      {body}
      {showName && (
        <text x={x + w / 2} y={y + d / 2 + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill={o.type === 'coffee_table' ? '#FFFFFF' : '#3C4852'} pointerEvents="none">
          {caption.length > 16 ? caption.slice(0, 15) + '…' : caption}
        </text>
      )}
      {selected && (
        <rect x={x - 4} y={y - 4} width={w + 8} height={d + 8} rx="4" fill="none" stroke="#3D5EF0" strokeWidth="2" strokeDasharray="5 3" pointerEvents="none" />
      )}
    </g>
  );
}

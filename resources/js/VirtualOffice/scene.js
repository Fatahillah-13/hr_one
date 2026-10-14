// Virtual Office – pembangun & renderer lantai isometrik.
// Semua objek disimpan sebagai kotak (box) dalam koordinat denah: x, y di lantai (1100 x 700), z = tinggi.
// Renderer memproyeksikan tiap sisi kotak ke 2D lalu menggambarnya di <canvas> dari yang terjauh ke terdekat
// (painter's algorithm). Tidak memakai CSS 3D, jadi hasilnya konsisten di semua browser.

import { FLOOR_W, FLOOR_H, autoZoneLabels, deriveSeat, zoneLabelSize } from './catalog';

export { FLOOR_W, FLOOR_H };
export const SEAT_Z = 15; // tinggi dudukan kursi, dipakai untuk posisi avatar

const H = 24; // tinggi meja
const C = {
  oak: ['#EFDBB8', '#D8BC8E', '#CBAE80'],
  steel: ['#4A535B', '#3B434A', '#323A41'],
  felt: ['#A3BDB3', '#8BA79C', '#7E9A8F'],
  black: ['#262D33', '#1F252A', '#1B2025'],
  kb: ['#F2F3F4', '#C9CDD1', '#BEC2C6'],
  seat: ['#3D8389', '#2F6A6F', '#285C61'],
  mesh: ['#3A4550', '#2E3740', '#283038'],
  arm: ['#2B3238', '#22282D', '#1E2328'],
  sofa: ['#E07A3A', '#C4632A', '#B0581F'],
  wall: ['#EFE9DF', '#F1ECE3', '#DDD5C7'],
  window: '#B9D8E6',
  glass: ['rgba(170,205,220,0.75)', 'rgba(170,205,220,0.4)', 'rgba(170,205,220,0.4)'],
};

/** Kursi kantor. Dipakai untuk meja karyawan (dinamis) dan meja rapat (statis). */
function chairParts(box, cx, cy, side, k = 18, noArms = false) {
  const b = k - 2;
  const a = C.arm;
  const m = C.mesh;
  box(cx - 8, cy - 8, 16, 16, 1.5, 0, a[0], a[1], a[2], { round: true });
  box(cx - 1.5, cy - 1.5, 3, 3, 9, 1.5, '#A7AEB5', '#8E959C', '#848B92', { layer: 1 });
  box(cx - k / 2, cy - k / 2, k, k, 4, 10.5, C.seat[0], C.seat[1], C.seat[2], { layer: 2 });
  if (side === 'L') box(cx - k / 2 - 3, cy - b / 2, 3, b, 18, 13, m[0], m[1], m[2], { layer: 3 });
  if (side === 'R') box(cx + k / 2, cy - b / 2, 3, b, 18, 13, m[0], m[1], m[2], { layer: 3 });
  if (side === 'T') box(cx - b / 2, cy - k / 2 - 3, b, 3, 18, 13, m[0], m[1], m[2], { layer: 3 });
  if (side === 'B') box(cx - b / 2, cy + k / 2, b, 3, 18, 13, m[0], m[1], m[2], { layer: 3 });
  if (noArms) return;
  if (side === 'L' || side === 'R') {
    box(cx - k / 2 + 2, cy - k / 2 - 1, k - 4, 2.5, 2, 19, a[0], a[1], a[2], { layer: 3 });
    box(cx - k / 2 + 2, cy + k / 2 - 1.5, k - 4, 2.5, 2, 19, a[0], a[1], a[2], { layer: 3 });
  } else {
    box(cx - k / 2 - 1, cy - k / 2 + 2, 2.5, k - 4, 2, 19, a[0], a[1], a[2], { layer: 3 });
    box(cx + k / 2 - 1.5, cy - k / 2 + 2, 2.5, k - 4, 2, 19, a[0], a[1], a[2], { layer: 3 });
  }
}

const makeBox = (list) => (x, y, w, d, h, z, top, front, side, o = {}) => {
  list.push({
    x, y, w, d, h, z, top, front, side,
    back: o.back || front, right: o.right || side,
    round: !!o.round, scr: o.scr || null, label: o.label || '', lc: o.lc || '#5A4A36', layer: o.layer || 0,
  });
};

export function buildScene(rawSeats, objects = []) {
  const seats = rawSeats.map((s) => (s.facing ? deriveSeat(s) : s));
  const groups = [];
  const flats = [];
  const labels = [];
  let cur = null;

  const group = (cx, cy) => {
    cur = { cx, cy, items: [] };
    groups.push(cur);
  };
  const box = (x, y, w, d, h, z, top, front, side, o = {}) => {
    cur.items.push({
      x, y, w, d, h, z, top, front, side,
      back: o.back || front, right: o.right || side,
      round: !!o.round, scr: o.scr || null, label: o.label || '', lc: o.lc || '#5A4A36', layer: o.layer || 0,
    });
  };
  const rect = (x, y, w, d, c) => flats.push({ pts: [[x, y], [x + w, y], [x + w, y + d], [x, y + d]], c });
  const shadow = (x, y, w, d) => rect(x + 4, y + 4, w, d, 'rgba(90,60,30,0.15)');

  // ---- lantai & ruangan ----
  rect(0, 0, FLOOR_W, FLOOR_H, '#DAD4CA');
  const room = (x, y, w, d) => {
    rect(x, y, w, d, '#CFC4B3');
    rect(x + 6, y + 6, w - 12, d - 12, '#F0DDBD');
    for (let px = x + 40; px < x + w - 8; px += 34) rect(px, y + 6, 1.2, d - 12, '#E4CEA7');
  };
  objects.filter((o) => o.type === 'room').forEach((o) => room(o.x, o.y, o.w, o.d));

  // ---- perabot meja ----
  const monitor = (x, y, along, facing) => {
    const B = C.black;
    if (along === 'y') {
      box(x - 3, y - 4, 7, 8, 1, H, B[0], B[1], B[2], { layer: 2 });
      box(x - 1, y - 1, 2, 2, 3, H + 1, B[0], B[1], B[2], { layer: 3 });
      box(x - 1.5, y - 13, 2.5, 26, 14, H + 3, B[0], B[1], B[2], { layer: 3, scr: facing === 'L' ? 'side' : 'right' });
    } else {
      box(x - 4, y - 3, 8, 7, 1, H, B[0], B[1], B[2], { layer: 2 });
      box(x - 1, y - 1, 2, 2, 3, H + 1, B[0], B[1], B[2], { layer: 3 });
      box(x - 13, y - 1.5, 26, 2.5, 14, H + 3, B[0], B[1], B[2], { layer: 3, scr: facing === 'T' ? 'back' : 'front' });
    }
  };

  const desk = (s) => {
    const { x, y, w, d } = s;
    shadow(x, y, w, d);
    group(x + w / 2, y + d / 2);
    const st = C.steel;
    if (s.monitor === 'top' || s.monitor === 'bottom') {
      box(x + 3, y + 2, w - 6, 3, H - 3, 0, st[0], st[1], st[2]);
      box(x + 3, y + d - 5, w - 6, 3, H - 3, 0, st[0], st[1], st[2]);
    } else {
      box(x + 2, y + 3, 3, d - 6, H - 3, 0, st[0], st[1], st[2]);
      box(x + w - 5, y + 3, 3, d - 6, H - 3, 0, st[0], st[1], st[2]);
    }
    box(x, y, w, d, 3, H - 3, C.oak[0], C.oak[1], C.oak[2], { layer: 1 });
    const f = C.felt;
    if (s.panel === 'xr') box(x + w - 2, y - 1, 4, d + 2, 22, H, f[0], f[1], f[2], { layer: 3 });
    if (s.panel === 'xl') box(x - 2, y - 1, 4, d + 2, 22, H, f[0], f[1], f[2], { layer: 3 });
    if (s.panel === 'yb') box(x - 1, y + d - 2, w + 2, 4, 22, H, f[0], f[1], f[2], { layer: 3 });
    if (s.panel === 'yt') box(x - 1, y - 2, w + 2, 4, 22, H, f[0], f[1], f[2], { layer: 3 });

    if (s.is_printer) {
      box(x + 9, y + 8, 30, 24, 12, H, '#ECEEF0', '#C9CED3', '#BCC2C8', { layer: 2 });
      box(x + 13, y + 11, 18, 18, 0.5, H + 12, '#3A434B', '#3A434B', '#3A434B', { layer: 3 });
      return;
    }
    const cx = x + w / 2;
    const cy = y + d / 2;
    const k = C.kb;
    if (s.monitor === 'right') {
      monitor(x + w - 11, cy, 'y', 'L');
      box(x + w - 30, cy - 9, 7, 18, 1, H, k[0], k[1], k[2], { layer: 2 });
      box(x + w - 28, cy + 12, 4, 3, 1.5, H, k[0], k[1], k[2], { layer: 2 });
    } else if (s.monitor === 'left') {
      monitor(x + 11, cy, 'y', 'R');
      box(x + 23, cy - 9, 7, 18, 1, H, k[0], k[1], k[2], { layer: 2 });
      box(x + 24, cy - 15, 4, 3, 1.5, H, k[0], k[1], k[2], { layer: 2 });
    } else if (s.monitor === 'top') {
      monitor(cx, y + d - 10, 'x', 'T');
      box(cx - 10, y + d - 24, 20, 7, 1, H, k[0], k[1], k[2], { layer: 2 });
    } else if (s.monitor === 'bottom') {
      monitor(cx, y + 10, 'x', 'B');
      box(cx - 10, y + 18, 20, 7, 1, H, k[0], k[1], k[2], { layer: 2 });
    }
  };

  const chair = (cx, cy, side, size = 18, noArms = false) => {
    group(cx, cy);
    chairParts(box, cx, cy, side, size, noArms);
  };

  // ---- meja & kursi dari database ----
  const seatPoints = {};
  seats.forEach((s) => {
    desk(s);
    // kursi + orangnya digambar per frame oleh buildPeople() supaya bisa dianimasikan
    if (!s.is_printer && s.seat_x != null) {
      seatPoints[s.code] = { x: s.seat_x, y: s.seat_y, zone: s.zone, side: s.chair_side || 'L' };
    }
  });

  // ---- ruangan, dinding & perabot dari database (vo_objects) ----
  // rotation: sisi "belakang" objek. 0 = atas, 90 = kanan, 180 = bawah, 270 = kiri.
  const segments = (o, size, fn) => {
    const alongX = o.w >= o.d;
    const len = alongX ? o.w : o.d;
    for (let i = 0, p = 0; p < len; p += size, i++) {
      const l = Math.min(size, len - p);
      if (alongX) fn(o.x + p, o.y, l, o.d, i);
      else fn(o.x, o.y + p, o.w, l, i);
    }
  };
  const backStrip = (o, t) => {
    const r = o.rotation || 0;
    if (r === 90) return [o.x + o.w - t, o.y, t, o.d];
    if (r === 180) return [o.x, o.y + o.d - t, o.w, t];
    if (r === 270) return [o.x, o.y, t, o.d];
    return [o.x, o.y, o.w, t];
  };
  const seatPart = (o, t) => {
    const r = o.rotation || 0;
    if (r === 90) return [o.x, o.y, o.w - t, o.d];
    if (r === 180) return [o.x, o.y, o.w, o.d - t];
    if (r === 270) return [o.x + t, o.y, o.w - t, o.d];
    return [o.x, o.y + t, o.w, o.d - t];
  };

  const RENDER = {
    wall: (o) => segments(o, 40, (x, y, w, d, i) => {
      group(x + w / 2, y + d / 2);
      const win = i % 3 === 0 ? C.wall[1] : C.window;
      if (o.w >= o.d) box(x, y, w, d, 46, 0, C.wall[0], win, C.wall[2]);
      else box(x, y, w, d, 46, 0, C.wall[0], C.wall[2], win);
    }),
    glass: (o) => segments(o, 40, (x, y, w, d) => {
      group(x + w / 2, y + d / 2);
      box(x, y, w, d, 34, 0, C.glass[0], C.glass[1], C.glass[2]);
    }),
    text: (o) => labels.push({ text: o.label || '', x: o.x + o.w / 2, y: o.y + o.d / 2, size: 14, color: '#A79C8D', spacing: 2 }),
    zone_label: (o) => o.label && labels.push({ text: o.label, x: o.x + o.w / 2, y: o.y + o.d / 2, size: zoneLabelSize(o.d), color: '#B8A07E', spacing: 2 }),
    meeting_table: (o) => {
      shadow(o.x, o.y, o.w, o.d);
      group(o.x + o.w / 2, o.y + o.d / 2);
      box(o.x + o.w / 2 - 15, o.y + o.d / 2 - 15, 30, 30, 18, 0, '#A89C8A', '#9A8E7C', '#8C806F');
      box(o.x, o.y, o.w, o.d, 4, 18, '#FFFFFF', '#E6E0D6', '#D8D1C5', { label: o.label, lc: '#8A7D6A', layer: 1 });
      if (o.w >= o.d) {
        const n = Math.max(1, Math.floor((o.w - 10) / 45));
        for (let i = 0; i < n; i++) {
          const cx = o.x + (o.w * (i + 0.5)) / n;
          chair(cx, o.y - 18, 'T', 16, true);
          chair(cx, o.y + o.d + 18, 'B', 16, true);
        }
      } else {
        const n = Math.max(1, Math.floor((o.d - 10) / 45));
        for (let i = 0; i < n; i++) {
          const cy = o.y + (o.d * (i + 0.5)) / n;
          chair(o.x - 18, cy, 'L', 16, true);
          chair(o.x + o.w + 18, cy, 'R', 16, true);
        }
      }
    },
    sofa: (o) => {
      const so = C.sofa;
      shadow(o.x, o.y, o.w, o.d);
      const [bx, by, bw, bd] = backStrip(o, 8);
      const [sx, sy, sw, sd] = seatPart(o, 8);
      group(bx + bw / 2, by + bd / 2);
      box(bx, by, bw, bd, 28, 0, so[0], so[1], so[2]);
      group(sx + sw / 2, sy + sd / 2);
      box(sx, sy, sw, sd, 12, 0, so[0], so[1], so[2]);
    },
    coffee_table: (o) => {
      shadow(o.x, o.y, o.w, o.d);
      group(o.x + o.w / 2, o.y + o.d / 2);
      box(o.x + 4, o.y + 4, 4, 4, 10, 0, '#222B32', '#222B32', '#1A2127');
      box(o.x + o.w - 8, o.y + o.d - 8, 4, 4, 10, 0, '#222B32', '#222B32', '#1A2127');
      box(o.x, o.y, o.w, o.d, 3, 10, '#3A4650', '#2A343C', '#222B32', { layer: 1 });
    },
    cabinet: (o) => {
      shadow(o.x, o.y, o.w, o.d);
      group(o.x + o.w / 2, o.y + o.d / 2);
      box(o.x, o.y, o.w, o.d, 52, 0, '#DCE8E0', '#A9C5B2', '#93B39D', { label: o.label, lc: '#2F5A3C' });
    },
    locker: (o) => segments(o, 40, (x, y, w, d) => {
      group(x + w / 2, y + d / 2);
      box(x + 0.5, y + 0.5, w - 1, d - 1, 34, 0, '#F6F6F4', '#D6D8DB', '#C4C7CB');
    }),
    whiteboard: (o) => {
      const [bx, by, bw, bd] = backStrip(o, 3);
      group(o.x + o.w / 2, o.y + o.d / 2);
      const alongX = bw >= bd;
      box(bx, by, alongX ? 3 : bw, alongX ? bd : 3, 12, 0, '#9AA1A8', '#8E959C', '#848B92');
      box(alongX ? bx + bw - 3 : bx, alongX ? by : by + bd - 3, alongX ? 3 : bw, alongX ? bd : 3, 12, 0, '#9AA1A8', '#8E959C', '#848B92');
      box(bx, by, bw, bd, 30, 12, '#C9CED3', '#F8FAFB', '#F8FAFB', { layer: 1 });
    },
    id_machine: (o) => {
      shadow(o.x, o.y, o.w, o.d);
      group(o.x + o.w / 2, o.y + o.d / 2);
      box(o.x, o.y, o.w, o.d, 40, 0, '#E1E5F7', '#B2BBE0', '#9DA8D6', { label: o.label, lc: '#2F3A78' });
    },
    dispenser: (o) => {
      shadow(o.x, o.y, o.w, o.d);
      group(o.x + o.w / 2, o.y + o.d / 2);
      box(o.x, o.y, o.w, o.d, 28, 0, '#F4F6F7', '#D7DCE0', '#C8CED3');
      box(o.x + 3, o.y + 3, o.w - 6, o.d - 6, 12, 28, '#CFE6F5', '#A9CFE8', '#9CC4DF', { layer: 1 });
    },
    plant: (o) => {
      const k = Math.min(o.w, o.d);
      const cx = o.x + o.w / 2;
      const cy = o.y + o.d / 2;
      const pot = k * 0.53;
      shadow(cx - pot / 2, cy - pot / 2, pot, pot);
      group(cx, cy);
      box(cx - pot / 2, cy - pot / 2, pot, pot, k * 0.53, 0, '#8E5A3B', '#7A4A2E', '#6E4229');
      box(cx - k / 2, cy - k / 2, k, k, 0, k * 0.73, '#5E9A4E', '#5E9A4E', '#5E9A4E', { round: true, layer: 1 });
      box(cx - k * 0.37, cy - k * 0.37, k * 0.73, k * 0.73, 0, k, '#6FAF5C', '#6FAF5C', '#6FAF5C', { round: true, layer: 2 });
      box(cx - k * 0.23, cy - k * 0.23, k * 0.47, k * 0.47, 0, k * 1.23, '#83C26E', '#83C26E', '#83C26E', { round: true, layer: 3 });
    },
  };
  objects.forEach((o) => RENDER[o.type]?.(o));

  // ---- tulisan zona: dari Editor Denah; denah lama tanpa tulisan zona memakai posisi otomatis ----
  if (!objects.some((o) => o.type === 'zone_label')) {
    autoZoneLabels(seats).forEach((o) => RENDER.zone_label(o));
  }

  return { groups, flats, labels, seatPoints };
}

// ---------------- proyeksi & render ----------------

// ---------------- karyawan (dianimasikan) ----------------

const BODY_SKINS = ['#F1C9A5', '#D9A47A', '#C68A5E', '#8D5A3B'];
const BODY_SHIRTS = ['#2F6F8F', '#8A5A44', '#4F7A30', '#7A4E8C', '#A9502F', '#3E6E6E', '#8C6417', '#4F5D95'];

/** Warna kulit/rambut/baju karyawan: dari avatar karakter kalau ada, kalau tidak dari id. */
export function lookFor(user) {
  const cfg = user.profile?.avatar_mode === 'character' ? user.profile.avatar_config || {} : {};
  const id = Math.abs(Number(user.id) || 0);
  return {
    skin: cfg.skin || BODY_SKINS[id % BODY_SKINS.length],
    hair: cfg.hair || (id % 3 === 2 ? 'panjang' : 'pendek'),
    shirt: cfg.shirt || BODY_SHIRTS[id % BODY_SHIRTS.length],
  };
}

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
};
const tone = (hex) => [hex, shade(hex, 0.86), shade(hex, 0.74)];

const ghostTone = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r0 = (n >> 16), g0 = ((n >> 8) & 255), b0 = (n & 255);
  // blend dengan abu-abu netral (#94A3B8) untuk figur offline di kantor
  const r = Math.round(r0 * 0.4 + 148 * 0.6);
  const g = Math.round(g0 * 0.4 + 163 * 0.6);
  const b = Math.round(b0 * 0.4 + 184 * 0.6);
  const base = `rgb(${r},${g},${b})`;
  return [base, `rgb(${Math.round(r * 0.86)},${Math.round(g * 0.86)},${Math.round(b * 0.86)})`, `rgb(${Math.round(r * 0.74)},${Math.round(g * 0.74)},${Math.round(b * 0.74)})`];
};

/**
 * Kursi + karyawan di setiap meja, digambar ulang per frame.
 * occupants: { [kodeMeja]: { look, status, phase } }. Meja tanpa occupant = kursi kosong.
 * t: waktu (detik) untuk animasi. Online = mengetik, sibuk = mengetik cepat, rapat = mengangguk.
 */
export function buildPeople(scene, occupants, t = 0) {
  const groups = [];
  Object.entries(scene.seatPoints).forEach(([code, sp]) => {
    const g = { cx: sp.x, cy: sp.y, items: [] };
    groups.push(g);
    const box = makeBox(g.items);
    chairParts(box, sp.x, sp.y, sp.side);
    const occ = occupants[code];
    if (occ) {
      if (occ.status === 'hadir') {
        // absen sudah masuk tapi belum login HR One: figur tetap tampil, tapi redup & grayscale
        person(box, sp, { ...occ, dimmed: true }, t);
      } else {
        person(box, sp, occ, t);
      }
    }
  });
  return groups;
}

function person(box, sp, occ, t) {
  const [dx, dy] = { L: [1, 0], R: [-1, 0], T: [0, 1], B: [0, -1] }[sp.side] || [1, 0];
  // persegi dalam koordinat lokal (f = maju ke arah meja, s = samping) → koordinat denah
  const R = (f0, f1, s0, s1) => {
    if (dx) {
      const a = sp.x + dx * f0;
      const b = sp.x + dx * f1;
      return [Math.min(a, b), sp.y + s0, Math.abs(b - a), s1 - s0];
    }
    const a = sp.y + dy * f0;
    const b = sp.y + dy * f1;
    return [sp.x + s0, Math.min(a, b), s1 - s0, Math.abs(b - a)];
  };
  const { look, status, phase } = occ;
  const isDimmed = occ.dimmed || occ.status === 'hadir';
  const getTone = isDimmed ? ghostTone : tone;
  const skin = getTone(look.skin);
  const shirt = getTone(look.shirt);
  const pants = getTone('#3A4650');
  const hair = getTone('#2C2420');
  const eye = getTone('#1E1A18');

  const B = (r, h, z, col) => box(r[0], r[1], r[2], r[3], h, z, col[0], col[1], col[2], { layer: 3 });

  const breath = 0.35 * Math.sin(t * 2.1 + phase);
  const typing = occ.chatting || status === 'online' || status === 'sibuk';
  const speed = occ.chatting ? 26 : status === 'sibuk' ? 22 : 13;
  const tapL = typing ? Math.max(0, Math.sin(t * speed + phase)) * 0.9 : 0;
  const tapR = typing ? Math.max(0, Math.sin(t * speed + phase + Math.PI)) * 0.9 : 0;
  const nod = occ.dimmed ? 0 : status === 'rapat' ? 0.7 * Math.sin(t * 3 + phase) : 0.25 * Math.sin(t * 1.3 + phase * 2);
  const lean = typing ? 0.6 + 0.3 * Math.sin(t * 0.7 + phase) : 0; // condong ke layar

  // kaki
  B(R(9, 12, -4.5, -0.8), 12, 2.5, pants);
  B(R(9, 12, 0.8, 4.5), 12, 2.5, pants);
  B(R(-2, 12, -4.5, -0.4), 4, 14.5, pants);
  B(R(-2, 12, 0.4, 4.5), 4, 14.5, pants);
  // badan
  B(R(-6 + lean, 1.5 + lean, -5, 5), 13 + breath, 14.5, shirt);
  // lengan
  B(R(-4 + lean, 0 + lean, -7.5, -5), 7, 20.5, shirt);
  B(R(-4 + lean, 0 + lean, 5, 7.5), 7, 20.5, shirt);
  if (typing) {
    B(R(0, 19, -7, -5), 2.5, 23.4 + tapL, shirt);
    B(R(0, 19, 5, 7), 2.5, 23.4 + tapR, shirt);
    B(R(19, 22.5, -7.2, -4.8), 1.8, 24.2 + tapL, skin);
    B(R(19, 22.5, 4.8, 7.2), 1.8, 24.2 + tapR, skin);
  } else {
    B(R(0, 9, -6.5, -4.5), 2.5, 18.5, shirt);
    B(R(0, 9, 4.5, 6.5), 2.5, 18.5, shirt);
    B(R(9, 11.5, -6.5, -4.5), 1.8, 18.6, skin);
    B(R(9, 11.5, 4.5, 6.5), 1.8, 18.6, skin);
  }
  // kepala
  const hz = 28 + breath + nod;
  const hf = lean + (status === 'rapat' ? 0.4 * Math.sin(t * 3 + phase) : 0);
  if (look.hair === 'hijab') B(R(-6.8 + hf, 1.6 + hf, -5, 5), 12.5, hz - 1.5, getTone('#5E4E86'));
  B(R(-5.5 + hf, 2.5 + hf, -4, 4), 9, hz, skin);
  B(R(2.5 + hf, 2.9 + hf, -2.6, -1.2), 1.4, hz + 4.5, eye);
  B(R(2.5 + hf, 2.9 + hf, 1.2, 2.6), 1.4, hz + 4.5, eye);
  if (look.hair === 'pendek' || look.hair === 'panjang') {
    B(R(-6 + hf, 3 + hf, -4.4, 4.4), 2.5, hz + 8.5, hair);
    B(R(-6 + hf, -4.8 + hf, -4.4, 4.4), look.hair === 'panjang' ? 13 : 6, look.hair === 'panjang' ? hz - 4 : hz + 3, hair);
  }
}

export const DEFAULT_VIEW = { rz: -38, tilt: 58, zoom: 1, panX: 0, panY: 0 };

/** Membuat fungsi proyeksi untuk ukuran stage tertentu. */
export function makeProjector(view, width, height) {
  const rad = Math.PI / 180;
  const cR = Math.cos(view.rz * rad);
  const sR = Math.sin(view.rz * rad);
  const cT = Math.cos(view.tilt * rad);
  const sT = Math.sin(view.tilt * rad);
  // skala dasar agar seluruh lantai muat di stage, lalu dikali zoom pengguna
  const fit = Math.min(width / 1350, height / 800);
  const Z = fit * view.zoom;
  const ox = width / 2 + view.panX;
  const oy = height / 2 + view.panY;
  const project = (x, y, z = 0) => {
    const dx = x - FLOOR_W / 2;
    const dy = y - FLOOR_H / 2;
    return [ox + Z * (cR * dx - sR * dy), oy + Z * ((sR * dx + cR * dy) * cT - z * sT)];
  };
  const depth = (x, y) => sR * (x - FLOOR_W / 2) + cR * (y - FLOOR_H / 2);
  return { project, depth, cR, sR, sT, Z };
}

// ---------------------------------------------------------------------------
// Renderer
// Setiap kotak diubah menjadi "op" (Path2D + warna + kotak batas di layar) sekali per tampilan.
// Saat animasi, hanya area di sekitar figur karyawan yang digambar ulang (dirty rect),
// latar (lantai, ruangan, perabot di belakang semua kursi) diambil dari gambar cache.
// ---------------------------------------------------------------------------
const SCREEN_STOPS = [[0, '#9AD2EE'], [0.45, '#4F93BC'], [1, '#2C6790']];
let textMeasureCtx = null;
const textW = (font, text) => {
  if (!textMeasureCtx) textMeasureCtx = document.createElement('canvas').getContext('2d');
  textMeasureCtx.font = font;
  return textMeasureCtx.measureText(text).width;
};

function polyOp(out, pts, fill) {
  const path = new Path2D();
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (i) path.lineTo(x, y); else path.moveTo(x, y);
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  // bagian yang di layar lebih kecil dari 1 piksel tidak perlu digambar
  if ((x1 - x0) * (y1 - y0) < 0.8 && !fill.grad) return;
  path.closePath();
  out.push({ path, fill, x0, y0, x1, y1 });
}
function textOp(out, text, [x, y], size, color, spacing) {
  const font = `800 ${size}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const w = textW(font, text) + spacing * text.length;
  out.push({ text, x, y, font, color, spacing, x0: x - w / 2, x1: x + w / 2, y0: y - size, y1: y + size });
}

function compileBox(b, P, out) {
  const { project, cR, sR, sT, Z } = P;
  const { x, y, w, d, z } = b;
  const zt = z + b.h;
  const quad = (x1, y1, x2, y2, color, isScreen) => {
    const pts = [project(x1, y1, z), project(x2, y2, z), project(x2, y2, zt), project(x1, y1, zt)];
    polyOp(out, pts, color);
    if (isScreen) {
      const mx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
      const my = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
      const inner = pts.map((p) => [mx + (p[0] - mx) * 0.84, my + (p[1] - my) * 0.8]);
      let minY = Infinity; let maxY = -Infinity;
      inner.forEach((p) => { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
      polyOp(out, inner, { grad: [minY, maxY] });
    }
  };
  if (sT > 0.02 && !b.round && b.h > 0.2) {
    if (cR < -0.001) quad(x, y, x + w, y, b.back, b.scr === 'back');
    if (cR > 0.001) quad(x, y + d, x + w, y + d, b.front, b.scr === 'front');
    if (sR < -0.001) quad(x, y, x, y + d, b.side, b.scr === 'side');
    if (sR > 0.001) quad(x + w, y, x + w, y + d, b.right, b.scr === 'right');
  }
  let top;
  if (b.round) {
    top = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      top.push(project(x + w / 2 + (Math.cos(a) * w) / 2, y + d / 2 + (Math.sin(a) * d) / 2, zt));
    }
  } else {
    top = [project(x, y, zt), project(x + w, y, zt), project(x + w, y + d, zt), project(x, y + d, zt)];
  }
  polyOp(out, top, b.top);
  if (b.label) textOp(out, b.label, project(x + w / 2, y + d / 2, zt), Math.max(9, 13 * Z * 1.25), b.lc, 0);
}

/** Gabungkan kotak yang bersentuhan/berdekatan supaya jumlah area gambar ulang sedikit. */
function mergeRects(list, width, height) {
  let rs = list
    .map((r) => ({ x0: Math.max(0, r.x0), y0: Math.max(0, r.y0), x1: Math.min(width, r.x1), y1: Math.min(height, r.y1) }))
    .filter((r) => r.x1 > r.x0 && r.y1 > r.y0);
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < rs.length && !merged; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i];
        const b = rs[j];
        if (a.x0 <= b.x1 + 6 && b.x0 <= a.x1 + 6 && a.y0 <= b.y1 + 6 && b.y0 <= a.y1 + 6) {
          rs[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
          rs.splice(j, 1);
          merged = true;
          break;
        }
      }
    }
  }
  // koordinat bulat supaya salinan latar tepat piksel
  return rs.map((r) => ({ x0: Math.floor(r.x0), y0: Math.floor(r.y0), x1: Math.ceil(r.x1), y1: Math.ceil(r.y1) }));
}

/** Satu grup → daftar op berurutan (per layer, lalu jarak ke kamera) + kotak batasnya. */
function compileGroup(g, P, cT) {
  const { depth, sT } = P;
  const camDepth = (it) => depth(it.x + it.w / 2, it.y + it.d / 2) * sT + (it.z + it.h / 2) * cT;
  const ops = [];
  g.items
    .map((it) => ({ it, k: camDepth(it) }))
    .sort((a, b) => a.it.layer - b.it.layer || a.k - b.k)
    .forEach(({ it }) => compileBox(it, P, ops));
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  ops.forEach((o) => { if (o.x0 < x0) x0 = o.x0; if (o.y0 < y0) y0 = o.y0; if (o.x1 > x1) x1 = o.x1; if (o.y1 > y1) y1 = o.y1; });
  return { ops, x0, y0, x1, y1 };
}

const hits = (o, rects) => {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (o.x0 <= r.x1 && o.x1 >= r.x0 && o.y0 <= r.y1 && o.y1 >= r.y0) return true;
  }
  return false;
};

function drawOps(ctx, ops, rects) {
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i];
    if (rects && !hits(o, rects)) continue;
    if (o.text) {
      ctx.font = o.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = o.color;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing}px`;
      ctx.fillText(o.text, o.x, o.y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      continue;
    }
    if (o.fill.grad) {
      const g = ctx.createLinearGradient(0, o.fill.grad[0], 0, o.fill.grad[1]);
      SCREEN_STOPS.forEach(([at, c]) => g.addColorStop(at, c));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = o.fill;
    }
    ctx.fill(o.path);
  }
}

/**
 * Renderer berstatus untuk satu canvas. draw() menggambar penuh saat tampilan/data berubah,
 * dan saat animasi hanya menggambar ulang area figur karyawan.
 */
export function createRenderer() {
  let cache = null;
  let prevRects = null;
  let movingKey = null;

  const keyOf = (view, width, height, dpr) => `${view.rz}|${view.tilt}|${view.zoom}|${view.panX}|${view.panY}|${width}|${height}|${dpr}`;

  // Saat lantai sedang diputar/digeser, tiap frame tampilannya baru: gambar langsung tanpa membuat cache.
  const drawDirect = (ctx, scene, view, width, height, dpr, occupants, t) => {
    const P = makeProjector(view, width, height);
    const cT = Math.cos((view.tilt * Math.PI) / 180);
    const entries = scene.groups.map((g) => ({ g, k: P.depth(g.cx, g.cy) }));
    Object.entries(scene.seatPoints).forEach(([code, sp]) => entries.push({ seat: code, k: P.depth(sp.x, sp.y) }));
    entries.sort((a, b) => a.k - b.k);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#EEF1F8';
    ctx.fillRect(0, 0, width, height);
    const flatOps = [];
    scene.flats.forEach((f) => polyOp(flatOps, f.pts.map((p) => P.project(p[0], p[1], 0)), f.c));
    scene.labels.forEach((l) => textOp(flatOps, l.text, P.project(l.x, l.y, 0), Math.max(10, l.size * P.Z * 1.25), l.color, l.spacing));
    drawOps(ctx, flatOps, null);
    entries.forEach((e) => {
      if (e.g) { drawOps(ctx, compileGroup(e.g, P, cT).ops, null); return; }
      const sp = scene.seatPoints[e.seat];
      const g = { cx: sp.x, cy: sp.y, items: [] };
      const box = makeBox(g.items);
      chairParts(box, sp.x, sp.y, sp.side);
      if (occupants[e.seat]) person(box, sp, occupants[e.seat], t);
      drawOps(ctx, compileGroup(g, P, cT).ops, null);
    });
    return P;
  };

  const prepare = (scene, view, width, height, dpr) => {
    const key = keyOf(view, width, height, dpr);
    if (cache && cache.scene === scene && cache.key === key) return cache;
    prevRects = null; // tampilan baru → wajib gambar penuh
    const P = makeProjector(view, width, height);
    const cT = Math.cos((view.tilt * Math.PI) / 180);

    // urutan grup: perabot + slot kursi, terjauh dulu
    const entries = scene.groups.map((g) => ({ g, k: P.depth(g.cx, g.cy) }));
    Object.entries(scene.seatPoints).forEach(([code, sp]) => entries.push({ seat: code, k: P.depth(sp.x, sp.y) }));
    entries.sort((a, b) => a.k - b.k);
    const firstSeat = entries.findIndex((e) => e.seat);
    const split = firstSeat < 0 ? entries.length : firstSeat;

    // latar: warna dasar, lantai, tulisan zona, perabot di belakang semua kursi
    const base = document.createElement('canvas');
    base.width = Math.max(1, Math.round(width * dpr));
    base.height = Math.max(1, Math.round(height * dpr));
    const bctx = base.getContext('2d');
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.fillStyle = '#EEF1F8';
    bctx.fillRect(0, 0, width, height);
    const flatOps = [];
    scene.flats.forEach((f) => polyOp(flatOps, f.pts.map((p) => P.project(p[0], p[1], 0)), f.c));
    scene.labels.forEach((l) => textOp(flatOps, l.text, P.project(l.x, l.y, 0), Math.max(10, l.size * P.Z * 1.25), l.color, l.spacing));
    drawOps(bctx, flatOps, null);
    for (let i = 0; i < split; i++) drawOps(bctx, compileGroup(entries[i].g, P, cT).ops, null);

    const order = entries.slice(split).map((e) => (e.seat ? { seat: e.seat } : compileGroup(e.g, P, cT)));
    cache = { scene, key, P, cT, base, order, empty: {} };
    return cache;
  };

  const seatGroup = (c, scene, code, occ, t) => {
    // kursi kosong tidak bergerak → cukup dihitung sekali per tampilan
    if (!occ && c.empty[code]) return c.empty[code];
    const sp = scene.seatPoints[code];
    const g = { cx: sp.x, cy: sp.y, items: [] };
    const box = makeBox(g.items);
    chairParts(box, sp.x, sp.y, sp.side);
    if (occ) person(box, sp, occ, t);
    const out = compileGroup(g, c.P, c.cT);
    if (!occ) c.empty[code] = out;
    return out;
  };

  return {
    /** full=true: gambar seluruh canvas. full=false: hanya area figur yang beranimasi. */
    draw(ctx, { scene, view, width, height, dpr, occupants, t, full }) {
      const key = keyOf(view, width, height, dpr);
      const cached = cache && cache.scene === scene && cache.key === key;
      if (!cached && full && movingKey !== key) {
        movingKey = key;
        prevRects = null;
        return drawDirect(ctx, scene, view, width, height, dpr, occupants, t);
      }
      movingKey = null;
      const c = prepare(scene, view, width, height, dpr);
      const seats = {};
      const rects = [];
      c.order.forEach((o) => {
        if (!o.seat) return;
        const occ = occupants[o.seat];
        const g = seatGroup(c, scene, o.seat, occ, t);
        seats[o.seat] = g;
        if (occ) rects.push({ x0: Math.floor(g.x0) - 2, y0: Math.floor(g.y0) - 2, x1: Math.ceil(g.x1) + 2, y1: Math.ceil(g.y1) + 2 });
      });

      const partial = !full && prevRects;
      const dirty = partial ? mergeRects(rects.concat(prevRects), width, height) : null;
      prevRects = rects;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!partial) {
        ctx.drawImage(c.base, 0, 0, width, height);
        c.order.forEach((o) => drawOps(ctx, (o.seat ? seats[o.seat] : o).ops, null));
        return c.P;
      }
      // per blok meja: potong (clip) persegi sederhana, salin latar dari cache, gambar ulang isi blok saja
      dirty.forEach((r) => {
        const one = [r];
        const w = r.x1 - r.x0;
        const h = r.y1 - r.y0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x0, r.y0, w, h);
        ctx.clip();
        ctx.imageSmoothingEnabled = false; // salinan 1:1 tanpa filter
        ctx.drawImage(c.base, r.x0 * dpr, r.y0 * dpr, w * dpr, h * dpr, r.x0, r.y0, w, h);
        ctx.imageSmoothingEnabled = true;
        c.order.forEach((o) => {
          const g = o.seat ? seats[o.seat] : o;
          if (hits(g, one)) drawOps(ctx, g.ops, one);
        });
        ctx.restore();
      });
      return c.P;
    },
    invalidate() { prevRects = null; },
  };
}

/** Gambar sekali (tanpa cache) – untuk pemakaian sederhana / tes. */
export function renderScene(ctx, scene, view, width, height, occupants = {}, t = 0, dpr = 1) {
  return createRenderer().draw(ctx, { scene, view, width, height, dpr, occupants, t, full: true });
}

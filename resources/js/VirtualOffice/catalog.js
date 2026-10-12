// Katalog objek denah + rumus meja. Dipakai editor (2D), lantai (3D), dan harus sama dengan backend:
// - OBJECT_TYPES  ↔ OfficeObject::TYPES
// - deriveSeat()  ↔ Seat::derive()

export const FLOOR_W = 1100;
export const FLOOR_H = 700;

/**
 * group: kelompok di palet editor. rotatable: punya sisi depan/belakang (rotasi bermakna).
 * labelled: punya teks label. color2d: warna di editor 2D.
 */
export const OBJECT_TYPES = {
  room: { name: 'Ruangan (lantai kayu)', group: 'Ruangan', w: 300, d: 240, color2d: '#F3E3C6', labelled: false },
  wall: { name: 'Dinding berjendela', group: 'Ruangan', w: 200, d: 8, color2d: '#B9D8E6', labelled: false },
  glass: { name: 'Partisi kaca', group: 'Ruangan', w: 4, d: 160, color2d: '#A9CFDD', labelled: false },
  text: { name: 'Teks di lantai', group: 'Ruangan', w: 80, d: 30, color2d: 'transparent', labelled: true, defaultLabel: 'AREA' },
  zone_label: { name: 'Tulisan zona', group: 'Ruangan', w: 120, d: 40, color2d: 'transparent', labelled: true, defaultLabel: 'ZONA' },
  meeting_table: { name: 'Meja rapat', group: 'Perabot', w: 170, d: 90, color2d: '#FFFFFF', labelled: true, defaultLabel: 'Meja Rapat' },
  sofa: { name: 'Sofa', group: 'Perabot', w: 120, d: 36, color2d: '#E07A3A', labelled: false, rotatable: true },
  coffee_table: { name: 'Meja kopi', group: 'Perabot', w: 56, d: 36, color2d: '#3A4650', labelled: false },
  cabinet: { name: 'Lemari', group: 'Perabot', w: 100, d: 40, color2d: '#A9C5B2', labelled: true, defaultLabel: 'Lemari' },
  locker: { name: 'Rak / loker', group: 'Perabot', w: 120, d: 28, color2d: '#D6D8DB', labelled: false },
  whiteboard: { name: 'Papan tulis', group: 'Perabot', w: 90, d: 14, color2d: '#F8FAFB', labelled: false, rotatable: true },
  id_machine: { name: 'Mesin ID card', group: 'Peralatan', w: 54, d: 72, color2d: '#B2BBE0', labelled: true, defaultLabel: 'ID' },
  dispenser: { name: 'Dispenser air', group: 'Peralatan', w: 22, d: 22, color2d: '#CFE6F5', labelled: false },
  plant: { name: 'Tanaman pot', group: 'Peralatan', w: 30, d: 30, color2d: '#6FAF5C', labelled: false },
};

/** Template meja yang bisa ditambahkan dari palet editor (posisi relatif). */
export const DESK_TEMPLATES = {
  single: { name: 'Meja tunggal', desc: '1 kursi', desks: [{ dx: 0, dy: 0, w: 36, d: 40, facing: 'L', has_panel: true }] },
  head: { name: 'Meja kepala', desc: 'Lebih lebar', desks: [{ dx: 0, dy: 0, w: 56, d: 30, facing: 'T', has_panel: true }] },
  pair: {
    name: 'Pasangan meja', desc: '2 kursi berhadapan',
    desks: [
      { dx: 0, dy: 0, w: 36, d: 40, facing: 'L', has_panel: true },
      { dx: 36, dy: 0, w: 36, d: 40, facing: 'R', has_panel: false },
    ],
  },
  cluster: {
    name: 'Kelompok 2×3', desc: '6 meja sekaligus',
    desks: [0, 1, 2].flatMap((r) => [
      { dx: 0, dy: r * 40, w: 36, d: 40, facing: 'L', has_panel: true },
      { dx: 36, dy: r * 40, w: 36, d: 40, facing: 'R', has_panel: false },
    ]),
  },
};

export const FACING_LABEL = { L: 'Kiri', R: 'Kanan', T: 'Atas', B: 'Bawah' };
const ROTATE_FACING = { L: 'T', T: 'R', R: 'B', B: 'L' };

/** Posisi monitor, partisi, dan titik duduk dihitung dari arah duduk (facing). */
export function deriveSeat(s) {
  const f = ['L', 'R', 'T', 'B'].includes(s.facing) ? s.facing : 'L';
  const { x, y, w, d } = s;
  const printer = !!s.is_printer;
  const seat = {
    L: [x - 16, y + Math.floor(d / 2)],
    R: [x + w + 16, y + Math.floor(d / 2)],
    T: [x + Math.floor(w / 2), y - 16],
    B: [x + Math.floor(w / 2), y + d + 16],
  }[f];
  return {
    ...s,
    facing: f,
    monitor: printer ? 'none' : { L: 'right', R: 'left', T: 'top', B: 'bottom' }[f],
    panel: s.has_panel ? { L: 'xr', R: 'xl', T: 'yb', B: 'yt' }[f] : null,
    seat_x: printer ? null : seat[0],
    seat_y: printer ? null : seat[1],
    chair_side: printer ? null : f,
  };
}

/** Putar meja 90° searah jarum jam di tempat (lebar & dalam ditukar, titik tengah tetap). */
export function rotateDesk(s) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.d / 2;
  return { ...s, w: s.d, d: s.w, x: Math.round(cx - s.d / 2), y: Math.round(cy - s.w / 2), facing: ROTATE_FACING[s.facing] || 'L' };
}

/** Putar objek 90° di tempat. */
export function rotateObject(o) {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.d / 2;
  return { ...o, w: o.d, d: o.w, x: Math.round(cx - o.d / 2), y: Math.round(cy - o.w / 2), rotation: ((o.rotation || 0) + 90) % 360 };
}

/** Kode meja berikutnya di zona tertentu, misal "C-5". */
export function nextSeatCode(seats, zone, taken = []) {
  const used = new Set([...seats.map((s) => s.code), ...taken]);
  let n = 1;
  seats.forEach((s) => {
    const m = String(s.code).match(new RegExp(`^${zone}-(\\d+)$`));
    if (m) n = Math.max(n, Number(m[1]) + 1);
  });
  while (used.has(`${zone}-${n}`)) n++;
  return `${zone}-${n}`;
}

/** Meja yang bertumpuk dengan meja lain (lebih dari 2 unit). */
export function overlappingSeatKeys(seats) {
  const bad = new Set();
  for (let i = 0; i < seats.length; i++) {
    for (let j = i + 1; j < seats.length; j++) {
      const a = seats[i];
      const b = seats[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y);
      if (ox > 2 && oy > 2) {
        bad.add(a.key);
        bad.add(b.key);
      }
    }
  }
  return bad;
}

// ---------------- tulisan zona ----------------
/** Ukuran huruf tulisan zona mengikuti tinggi kotaknya (d). */
export const zoneLabelSize = (d) => Math.max(10, Math.min(40, Math.round(d * 0.5)));
export const ZONE_LABEL_SIZES = [['Kecil', 28], ['Sedang', 40], ['Besar', 56]];

/**
 * Posisi otomatis "ZONA X" di bawah kelompok meja tiap zona.
 * Dipakai kalau denah belum punya objek tulisan zona (data lama), supaya tampilan tidak berubah.
 */
export function autoZoneLabels(seats) {
  const zones = {};
  seats.forEach((s) => {
    const z = (zones[s.zone] ||= { minx: 1e9, maxx: -1e9, maxy: -1e9 });
    z.minx = Math.min(z.minx, s.x);
    z.maxx = Math.max(z.maxx, s.x + s.w);
    z.maxy = Math.max(z.maxy, s.y + s.d);
  });
  return Object.entries(zones)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, z]) => {
      const w = 120;
      const cx = Math.round((z.minx + z.maxx) / 2);
      return { type: 'zone_label', x: cx - w / 2, y: Math.round(z.maxy + 20), w, d: 40, rotation: 0, label: `ZONA ${name}` };
    });
}

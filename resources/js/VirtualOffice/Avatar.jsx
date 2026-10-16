import React, { useState } from 'react';
import '../../css/virtual-office.css';

export const STATUS = {
  online: { label: 'Online', ring: '#1E9E5A' },
  rapat: { label: 'Rapat', ring: '#C98A0C' },
  sibuk: { label: 'Sibuk', ring: '#D2453B' },
  hadir: { label: 'Offline (Di kantor)', ring: '#94A3B8' }, // sudah absen masuk tapi belum membuka HR One
  offline: { label: 'Offline', ring: '#A3ABB2' },
};

const PALETTE = ['#2F6F8F', '#8A5A44', '#4F7A30', '#7A4E8C', '#A9502F', '#3E6E6E', '#8C6417', '#4F5D95'];

export const colorFor = (id) => PALETTE[Math.abs(Number(id) || 0) % PALETTE.length];
export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

/** Status yang tampil: kalau tidak terhubung ke lantai = offline. */
export const effectiveStatus = (user, onlineIds) => {
  if (onlineIds.has(user.id)) return user.profile?.status || 'online';
  return user.profile?.attendance?.state === 'present' ? 'hadir' : 'offline';
};

/** Bubble yang tampil: bubble buatan sendiri, atau keterangan absensi (Cuti, Sudah pulang, Offline di kantor) saat tidak online. */
export const bubbleOf = (user, onlineIds) => {
  if (user.profile?.bubble) return user.profile.bubble;
  if (!onlineIds.has(user.id)) {
    if (user.profile?.attendance?.state === 'present') {
      return 'Offline (Di kantor)';
    }
    return user.profile?.attendance?.label || null;
  }
  return null;
};

/** Karakter avatar (SVG 180x180) dari config {skin, hair, shirt, acc}. */
export function Character({ config = {}, size = 180 }) {
  const skin = config.skin || '#C68A5E';
  const shirt = config.shirt || '#3D5EF0';
  const hair = config.hair || 'pendek';
  const acc = config.acc || 'none';
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" aria-hidden="true">
      <rect width="180" height="180" fill="#E4EAFF" />
      {hair === 'panjang' && <rect x="48" y="32" width="84" height="100" rx="40" fill="#2C2420" />}
      {hair === 'hijab' && <rect x="42" y="24" width="96" height="132" rx="46" fill="#5E4E86" />}
      <rect x="28" y="124" width="124" height="110" rx="62" fill={shirt} />
      <rect x="58" y="40" width="64" height="72" rx="32" fill={skin} />
      {(hair === 'pendek' || hair === 'panjang') && (
        <path d="M54 62 V58 a36 28 0 0 1 72 0 V62 Z" fill="#2C2420" />
      )}
      <circle cx="76.5" cy="77.5" r="3.5" fill="#2A2421" />
      <circle cx="103.5" cy="77.5" r="3.5" fill="#2A2421" />
      <path d="M81 92 q9 8 18 0" stroke="#7A3B2E" strokeWidth="3" fill="none" strokeLinecap="round" />
      {acc === 'kacamata' && (
        <g stroke="#1E2A32" strokeWidth="3" fill="none">
          <rect x="65" y="69" width="21" height="16" rx="5" />
          <rect x="94" y="69" width="21" height="16" rx="5" />
          <path d="M86 75 H94" />
        </g>
      )}
      {acc === 'idcard' && (
        <g>
          <path d="M77 124 V138 a13 13 0 0 0 26 0 V124" stroke="#3D5EF0" strokeWidth="3" fill="none" />
          <rect x="79" y="146" width="22" height="28" rx="3" fill="#FFFFFF" stroke="#BFB3A1" />
        </g>
      )}
    </svg>
  );
}

/** Lingkaran avatar dengan ring warna status. */
function AvatarBase({ user, status = 'online', size = 44, ring = true, className = '' }) {
  const p = user.profile || {};
  const [photoFailed, setPhotoFailed] = useState(false);
  // foto dari data karyawan HRD / akun HR One, dipakai kalau karyawan belum membuat avatar sendiri
  const fallbackPhoto = !photoFailed && p.avatar_mode !== 'character' && !(p.avatar_mode === 'photo' && p.avatar_url) ? user.photo_url : null;
  const border = ring ? Math.max(2, Math.round(size / 15)) : 0;
  const isOfflineLike = status === 'offline' || status === 'hadir';
  const style = {
    width: size,
    height: size,
    borderWidth: border,
    borderColor: STATUS[status]?.ring || STATUS.online.ring,
    background: colorFor(user.id),
    fontSize: Math.round(size * 0.3),
    opacity: isOfflineLike ? 0.58 : 1,
    filter: isOfflineLike ? 'grayscale(25%)' : 'none',
    transition: 'opacity .2s ease, filter .2s ease',
  };
  const avatarNode = (
    <span className={`vo-avatar ${isOfflineLike ? 'is-offline-avatar' : ''} ${className}`} style={style}>
      {p.avatar_mode === 'photo' && p.avatar_url ? (
        <img src={p.avatar_url} alt="" />
      ) : p.avatar_mode === 'character' ? (
        <Character config={p.avatar_config || {}} size={size - border * 2} />
      ) : fallbackPhoto ? (
        <img src={fallbackPhoto} alt="" onError={() => setPhotoFailed(true)} />
      ) : (
        initials(user.name)
      )}
    </span>
  );

  if (user?.is_birthday_today) {
    return (
      <span className="vo-avatar-bday-wrap" style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
        {avatarNode}
        <span
          className="vo-avatar-party-hat"
          title="Hari ini berulang tahun! 🎉"
          aria-label="Ulang tahun hari ini"
          style={{
            position: 'absolute',
            top: -Math.round(size * 0.28),
            right: -Math.round(size * 0.16),
            fontSize: Math.round(size * 0.52),
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 3,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            animation: 'voBounce 2s ease-in-out infinite',
          }}
        >
          🥳
        </span>
      </span>
    );
  }

  return avatarNode;
}

// memo: puluhan avatar di lantai tidak perlu digambar ulang saat lantai diputar/digeser
const Avatar = React.memo(AvatarBase);
export default Avatar;

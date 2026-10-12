import React, { useEffect, useRef, useState } from 'react';
import Avatar, { Character } from './Avatar';
import { api, errorText } from './api';

const SKINS = [['#F1C9A5', 'Terang'], ['#D9A47A', 'Kuning langsat'], ['#C68A5E', 'Sawo matang'], ['#8D5A3B', 'Gelap']];
const SHIRTS = [['#3D5EF0', 'Hijau toska'], ['#2F4F8F', 'Biru'], ['#A9502F', 'Bata'], ['#4F7A30', 'Hijau'], ['#3A4650', 'Abu gelap'], ['#8C6417', 'Kunyit']];
const HAIRS = [['pendek', 'Pendek'], ['panjang', 'Panjang'], ['hijab', 'Hijab'], ['botak', 'Botak']];
const ACCS = [['none', 'Tidak ada'], ['kacamata', 'Kacamata'], ['idcard', 'ID card']];

const CROP = 260; // ukuran area crop di layar
const OUT = 256; // ukuran file hasil

export default function AvatarDialog({ me, onClose, onSaved }) {
  const p = me.profile || {};
  const [mode, setMode] = useState(p.avatar_mode === 'photo' ? 'photo' : 'character');
  const [config, setConfig] = useState({ skin: '#C68A5E', hair: 'pendek', shirt: '#3D5EF0', acc: 'none', ...(p.avatar_config || {}) });
  const [img, setImg] = useState(null); // HTMLImageElement
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const drag = useRef(null);

  // gambar area crop
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !img) return;
    const ctx = c.getContext('2d');
    const base = CROP / Math.min(img.width, img.height);
    const s = base * zoom;
    const w = img.width * s;
    const h = img.height * s;
    ctx.clearRect(0, 0, CROP, CROP);
    ctx.drawImage(img, (CROP - w) / 2 + offset.x, (CROP - h) / 2 + offset.y, w, h);
  }, [img, zoom, offset]);

  const pickFile = (file) => {
    setError('');
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Pakai file JPG, PNG, atau WEBP.');
    if (file.size > 5 * 1024 * 1024) return setError('Ukuran foto maksimal 5 MB.');
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    im.src = url;
  };

  const exportPhoto = () =>
    new Promise((resolve) => {
      const out = document.createElement('canvas');
      out.width = OUT;
      out.height = OUT;
      out.getContext('2d').drawImage(canvasRef.current, 0, 0, CROP, CROP, 0, 0, OUT, OUT);
      out.toBlob(resolve, 'image/jpeg', 0.9);
    });

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      let profile;
      if (mode === 'photo') {
        if (!img) throw new Error('Pilih foto dulu.');
        profile = await api.updateAvatar({ mode: 'photo', photoBlob: await exportPhoto() });
      } else {
        profile = await api.updateAvatar({ mode: 'character', config });
      }
      onSaved(profile);
      onClose();
    } catch (e) {
      setError(e.response ? errorText(e) : e.message);
    } finally {
      setSaving(false);
    }
  };

  // mode foto: pratinjau kanan menampilkan avatar saat ini; hasil crop terlihat di area crop
  const previewUser = mode === 'photo' ? me : { ...me, profile: { ...p, avatar_mode: 'character', avatar_config: config } };

  return (
    <div className="vo-modal-backdrop" onClick={onClose}>
      <div className="vo-modal vo-modal-wide" role="dialog" aria-label="Buat avatar" onClick={(e) => e.stopPropagation()}>
        <h3>Avatar saya</h3>
        <div className="vo-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'photo'} onClick={() => setMode('photo')}>Upload foto</button>
          <button type="button" role="tab" aria-selected={mode === 'character'} onClick={() => setMode('character')}>Karakter</button>
        </div>

        <div className="vo-avatar-body">
          {mode === 'photo' ? (
            <div className="vo-photo">
              <label
                className="vo-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files[0]);
                }}
              >
                <strong>Tarik foto ke sini</strong>
                <span>atau klik untuk memilih · JPG/PNG, maks 5 MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickFile(e.target.files[0])} />
              </label>
              {img && (
                <div className="vo-crop">
                  <div
                    className="vo-crop-area"
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
                    }}
                    onPointerMove={(e) => drag.current && setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })}
                    onPointerUp={() => { drag.current = null; }}
                  >
                    <canvas ref={canvasRef} width={CROP} height={CROP} />
                    <div className="vo-crop-mask" />
                  </div>
                  <label className="vo-field">
                    Zoom
                    <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                  </label>
                  <small>Geser foto untuk mengatur posisi. Disimpan 256×256 px dan dikompres otomatis.</small>
                </div>
              )}
            </div>
          ) : (
            <div className="vo-char-options">
              <Swatches title="Warna kulit" items={SKINS} value={config.skin} onPick={(v) => setConfig({ ...config, skin: v })} />
              <Chips title="Rambut / kepala" items={HAIRS} value={config.hair} onPick={(v) => setConfig({ ...config, hair: v })} />
              <Swatches title="Warna baju" items={SHIRTS} value={config.shirt} onPick={(v) => setConfig({ ...config, shirt: v })} square />
              <Chips title="Aksesori" items={ACCS} value={config.acc} onPick={(v) => setConfig({ ...config, acc: v })} />
            </div>
          )}

          <div className="vo-avatar-preview">
            {mode === 'character' ? (
              <span className="vo-big-avatar"><Character config={config} size={160} /></span>
            ) : (
              <Avatar user={previewUser} size={160} />
            )}
            <small>Tampilan di lantai</small>
            <Avatar user={previewUser} size={44} />
          </div>
        </div>

        {error && <div className="vo-error">{error}</div>}
        <div className="vo-row vo-modal-actions">
          <span className="vo-grow" />
          <button type="button" className="vo-btn" onClick={onClose}>Batal</button>
          <button type="button" className="vo-btn vo-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Swatches({ title, items, value, onPick, square }) {
  return (
    <div className="vo-field">
      {title}
      <div className="vo-swatches" role="radiogroup" aria-label={title}>
        {items.map(([c, label]) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === c}
            aria-label={label}
            className={`${square ? 'is-square' : ''}${value === c ? ' is-on' : ''}`}
            style={{ background: c }}
            onClick={() => onPick(c)}
          />
        ))}
      </div>
    </div>
  );
}

function Chips({ title, items, value, onPick }) {
  return (
    <div className="vo-field">
      {title}
      <div className="vo-chips" role="radiogroup" aria-label={title}>
        {items.map(([v, label]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'is-on' : ''} onClick={() => onPick(v)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

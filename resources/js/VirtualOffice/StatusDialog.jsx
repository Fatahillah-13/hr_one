import React, { useState } from 'react';
import Avatar, { STATUS } from './Avatar';
import { api, errorText } from './api';

const DESC = { online: 'Siap dihubungi', rapat: 'Sedang meeting', sibuk: 'Notifikasi dibisukan', offline: 'Tampil tidak aktif' };
const PRESETS = ['Istirahat 15 menit', 'Rapat di ruang meeting', 'Di area produksi', 'Tarik data absensi', 'Cuti hari ini'];
const DURATIONS = [
  ['30', '30 menit'],
  ['60', '1 jam'],
  ['240', '4 jam'],
  ['today', 'Hari ini'],
  ['never', 'Jangan hapus'],
];

export default function StatusDialog({ me, onClose, onSaved }) {
  const [status, setStatus] = useState(me.profile?.status || 'online');
  const [bubble, setBubble] = useState(me.profile?.bubble || '');
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const profile = await api.updateStatus({ status, bubble: bubble.trim() || null, duration });
      onSaved(profile);
      onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vo-modal-backdrop" onClick={onClose}>
      <div className="vo-modal" role="dialog" aria-label="Atur status" onClick={(e) => e.stopPropagation()}>
        <h3>Atur status &amp; bubble</h3>

        <div className="vo-status-preview">
          {bubble.trim() && <div className="vo-bubble">{bubble}</div>}
          <Avatar user={me} status={status} size={56} />
        </div>

        <div className="vo-status-grid" role="radiogroup" aria-label="Status">
          {['online', 'rapat', 'sibuk', 'offline'].map((k) => [k, STATUS[k]]).map(([k, s]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={status === k}
              className={status === k ? 'is-on' : ''}
              onClick={() => setStatus(k)}
            >
              <i style={{ borderColor: s.ring }} />
              <span>
                <strong>{s.label}</strong>
                <small>{DESC[k]}</small>
              </span>
            </button>
          ))}
        </div>

        <label className="vo-field">
          <span className="vo-row">
            Bubble status <small>{bubble.length}/40</small>
          </span>
          <input value={bubble} maxLength={40} onChange={(e) => setBubble(e.target.value)} placeholder="Contoh: Istirahat 15 menit" />
        </label>
        <div className="vo-chips">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setBubble(p)}>{p}</button>
          ))}
        </div>

        <div className="vo-field">
          Hapus bubble otomatis
          <div className="vo-chips" role="radiogroup">
            {DURATIONS.map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={duration === v} className={duration === v ? 'is-on' : ''} onClick={() => setDuration(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="vo-error">{error}</div>}
        <div className="vo-row vo-modal-actions">
          <button type="button" className="vo-btn vo-btn-danger-text" onClick={() => setBubble('')}>Hapus bubble</button>
          <span className="vo-grow" />
          <button type="button" className="vo-btn" onClick={onClose}>Batal</button>
          <button type="button" className="vo-btn vo-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

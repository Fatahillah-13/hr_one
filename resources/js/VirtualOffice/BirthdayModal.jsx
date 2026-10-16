import React, { useState } from 'react';
import Avatar, { STATUS, effectiveStatus } from './Avatar';

export default function BirthdayModal({
  birthdays = { today: [], this_month: [], upcoming: [], month_name: 'Bulan Ini' },
  usersById = {},
  onlineIds = new Set(),
  meId,
  onClose,
  onWish,
}) {
  const [tab, setTab] = useState(birthdays.today && birthdays.today.length > 0 ? 'today' : 'month');

  const todayList = birthdays.today || [];
  const monthList = birthdays.this_month || [];
  const upcomingList = birthdays.upcoming || [];

  return (
    <div className="vo-modal-backdrop" onClick={onClose}>
      <div
        className="vo-modal vo-birthday-modal"
        role="dialog"
        aria-label="Pemberitahuan Ulang Tahun"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        <div className="vo-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>🎂</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Ulang Tahun Karyawan</h3>
              <small style={{ color: 'var(--vo-muted)', fontWeight: 500 }}>
                {todayList.length > 0
                  ? `🎉 ${todayList.length} orang berulang tahun hari ini!`
                  : `Jadwal & pengingat ulang tahun di HR One`}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="vo-icon-btn"
            aria-label="Tutup"
            onClick={onClose}
            style={{ fontSize: 20 }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="vo-chips" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={tab === 'today' ? 'is-on' : ''}
            onClick={() => setTab('today')}
          >
            🎂 Hari Ini {todayList.length > 0 && `(${todayList.length})`}
          </button>
          <button
            type="button"
            className={tab === 'month' ? 'is-on' : ''}
            onClick={() => setTab('month')}
          >
            📅 Bulan {birthdays.month_name || 'Ini'} ({monthList.length})
          </button>
          <button
            type="button"
            className={tab === 'upcoming' ? 'is-on' : ''}
            onClick={() => setTab('upcoming')}
          >
            ⏰ 30 Hari Mendatang ({upcomingList.length})
          </button>
        </div>

        {/* Tab 1: Hari Ini */}
        {tab === 'today' && (
          <div className="vo-bday-tab-pane">
            {todayList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {todayList.map((item) => {
                  const u = usersById[item.user_id] || item;
                  const isMe = item.user_id === meId;
                  return (
                    <div
                      key={item.user_id}
                      className="vo-bday-celebrate-card"
                      style={{
                        background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(252, 231, 243, 0.9) 50%, rgba(238, 242, 255, 0.9) 100%)',
                        border: '1.5px solid #FCD34D',
                        borderRadius: 16,
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Avatar user={u} status={effectiveStatus(u, onlineIds)} size={54} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                            <span>🎉 BERULANG TAHUN HARI INI</span>
                          </div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#1F2937', marginTop: 3 }}>
                            {item.name} {isMe && <small style={{ color: '#4F46E5', fontWeight: 600 }}>(Kamu)</small>}
                          </div>
                          <div style={{ fontSize: 12, color: '#4B5563' }}>
                            {[item.job_level, item.department || item.division].filter(Boolean).join(' · ')}
                            {item.seat_code ? ` · Meja ${item.seat_code}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                          🎂 Usia ke-{item.age} tahun ({item.birth_day_month})
                        </span>
                        {!isMe && (
                          <button
                            type="button"
                            className="vo-btn vo-btn-primary"
                            style={{
                              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                              borderColor: 'transparent',
                              color: '#fff',
                              fontWeight: 700,
                              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.35)',
                            }}
                            onClick={() => {
                              onWish?.(item.user_id, item.name);
                              onClose();
                            }}
                          >
                            🎉 Kirim Ucapan Selamat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--vo-muted)' }}>
                <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🎈</span>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--vo-text)' }}>
                  Tidak ada yang berulang tahun hari ini.
                </p>
                <small style={{ display: 'block', marginTop: 4 }}>
                  {upcomingList.length > 0
                    ? `Ulang tahun terdekat: ${upcomingList[0].name} (${upcomingList[0].birth_day_month} - ${upcomingList[0].days_left === 1 ? 'Besok!' : `${upcomingList[0].days_left} hari lagi`})`
                    : 'Cek daftar ulang tahun bulan ini pada tab di atas.'}
                </small>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bulan Ini */}
        {tab === 'month' && (
          <div className="vo-bday-list" style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthList.length > 0 ? (
              monthList.map((item) => {
                const u = usersById[item.user_id] || item;
                const isMe = item.user_id === meId;
                return (
                  <div
                    key={item.user_id}
                    className="vo-bday-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: item.is_today ? 'rgba(254, 243, 199, 0.6)' : 'var(--vo-soft)',
                      border: item.is_today ? '1px solid #FCD34D' : '1px solid var(--vo-line-2)',
                    }}
                  >
                    <Avatar user={u} status={effectiveStatus(u, onlineIds)} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </strong>
                        {item.is_today && <span style={{ fontSize: 13 }}>🎂</span>}
                        {isMe && <small style={{ color: '#4F46E5', fontWeight: 600 }}>(Kamu)</small>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--vo-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span>{[item.job_level, item.department || item.division].filter(Boolean).join(' · ')}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: item.is_today ? '#B45309' : 'var(--vo-text)' }}>
                        {item.birth_day_month}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>
                        {item.is_today ? (
                          <span style={{ color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 6 }}>Hari ini! 🎉</span>
                        ) : item.days_left === 1 ? (
                          <span style={{ color: '#2563EB', background: '#DBEAFE', padding: '2px 6px', borderRadius: 6 }}>Besok!</span>
                        ) : item.days_left > 1 && item.days_left <= 30 ? (
                          <span style={{ color: '#4B5563' }}>{item.days_left} hari lagi</span>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>Sudah lewat</span>
                        )}
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        type="button"
                        className="vo-btn vo-btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600 }}
                        title="Kirim pesan / ucapan"
                        onClick={() => {
                          onWish?.(item.user_id, item.name);
                          onClose();
                        }}
                      >
                        {item.is_today ? 'Ucapan 🎉' : 'Chat'}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', padding: 24, color: 'var(--vo-muted)' }}>
                Tidak ada data ulang tahun di bulan ini.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Mendatang */}
        {tab === 'upcoming' && (
          <div className="vo-bday-list" style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingList.length > 0 ? (
              upcomingList.map((item) => {
                const u = usersById[item.user_id] || item;
                const isMe = item.user_id === meId;
                return (
                  <div
                    key={item.user_id}
                    className="vo-bday-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: item.is_today ? 'rgba(254, 243, 199, 0.6)' : 'var(--vo-soft)',
                      border: item.is_today ? '1px solid #FCD34D' : '1px solid var(--vo-line-2)',
                    }}
                  >
                    <Avatar user={u} status={effectiveStatus(u, onlineIds)} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </strong>
                        {item.is_today && <span style={{ fontSize: 13 }}>🎂</span>}
                        {isMe && <small style={{ color: '#4F46E5', fontWeight: 600 }}>(Kamu)</small>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--vo-muted)' }}>
                        {[item.job_level, item.department || item.division].filter(Boolean).join(' · ')}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--vo-text)' }}>
                        {item.birth_day_month}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>
                        {item.is_today ? (
                          <span style={{ color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 6 }}>Hari ini! 🎉</span>
                        ) : item.days_left === 1 ? (
                          <span style={{ color: '#2563EB', background: '#DBEAFE', padding: '2px 6px', borderRadius: 6 }}>Besok!</span>
                        ) : (
                          <span style={{ color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 6 }}>
                            {item.days_left} hari lagi
                          </span>
                        )}
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        type="button"
                        className="vo-btn vo-btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600 }}
                        title="Kirim pesan / ucapan"
                        onClick={() => {
                          onWish?.(item.user_id, item.name);
                          onClose();
                        }}
                      >
                        {item.is_today ? 'Ucapan 🎉' : 'Chat'}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', padding: 24, color: 'var(--vo-muted)' }}>
                Tidak ada ulang tahun dalam 30 hari ke depan.
              </p>
            )}
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--vo-line-2)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="vo-btn" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

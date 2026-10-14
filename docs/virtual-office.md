# Virtual Office – dokumentasi teknis

Modul HR One: lantai kantor 3D isometrik, chat personal & grup realtime, status + bubble, avatar,
status otomatis dari absensi, notifikasi di semua halaman, dan Editor Denah.
Laravel 11+ · Inertia React · MySQL · realtime lewat **Laravel Reverb** (WebSocket di LAN).

Cara memasang: lihat `BACA-DULU.md` di paket (script `terapkan.ps1`). Cek instalasi kapan saja: `php artisan vo:doctor`.

## Struktur

```
app/Http/Controllers/VirtualOffice/   Office (lantai), Chat, Profile (status/avatar), Layout (Editor Denah)
app/Models/VirtualOffice/             Seat, OfficeObject, LayoutVersion, Profile, Conversation, Message
app/Events/VirtualOffice/             event realtime (ShouldBroadcastNow, tanpa queue)
app/Support/VirtualOffice/
  VoAccess.php            siapa boleh memakai (kartu aplikasi di Settings > Home) & siapa admin editor
  Realtime.php            kirim event; kalau Reverb mati request tetap sukses (dicatat di log)
  EmployeeDirectory.php   data karyawan dari database HRD (read-only, di-cache)
  AttendanceSync.php      status kehadiran dari log mesin absensi + tabel cuti
  UnreadCounter.php       jumlah pesan belum dibaca (badge header)
  ConversationPresenter.php
app/Console/Commands/     vo:doctor, vo:assign, vo:expire-bubbles, vo:sync-attendance
app/Http/Middleware/EnsureVoAdmin.php
config/virtual-office.php
database/migrations/2026_10_04_00000{1..4}_*.php
database/seeders/VirtualOfficeLayoutSeeder.php   denah awal Zona A–E (hanya diisi kalau tabel kosong)
routes/virtual-office.php            route (middleware auth + app.access:virtual-office)
routes/channels-virtual-office.php   otorisasi channel
routes/console-virtual-office.php    jadwal
resources/js/Pages/VirtualOffice/    Index.jsx (lantai + chat), Editor.jsx (Editor Denah)
resources/js/VirtualOffice/
  scene.js           renderer canvas 3D (cache per sudut pandang + gambar ulang area figur saja)
  catalog.js         katalog perabot, rumus meja, tulisan zona
  OfficeFloor.jsx    lantai: kontrol kamera, figur, bubble, kartu profil
  ChatPanel.jsx, StatusDialog.jsx, AvatarDialog.jsx, Avatar.jsx
  useRealtime.js     Echo: presence vo.office, vo.user.{id}, vo.conversation.{id}
  VoNotifier.jsx     popup + suara pesan di semua halaman (dipasang di AuthenticatedLayout)
  notify.js          badge belum dibaca, suara, notifikasi desktop
  editor/FloorEditor.jsx
resources/css/virtual-office.css, vo-notifier.css     semua class diawali .vo-
tests/Feature/VirtualOfficeTest.php
```

## Perintah

```bash
php artisan vo:doctor                          # cek instalasi (tidak mengubah data)
php artisan vo:assign --list                   # daftar meja
php artisan vo:assign C-1 andy                 # tempatkan user (username/email/id) di meja
php artisan vo:assign C-4 --clear              # kosongkan meja
php artisan vo:sync-attendance --dry-run       # cek hasil absensi tanpa menyimpan
php artisan reverb:start --host=0.0.0.0 --port=8090   # server realtime (dijalankan task "HR One Reverb")
```

## Pengaturan (.env)

| Variabel | Default | Fungsi |
|---|---|---|
| `VO_ADMINS` | – | username/email/id tambahan yang boleh membuka Editor Denah (role Admin HR One selalu boleh) |
| `VO_EMPLOYEE_LINK` | `true` | ambil data karyawan dari database HRD |
| `VO_EMPLOYEE_USER_COLUMN` | `username` | kolom di `users` HR One |
| `VO_EMPLOYEE_COLUMN` | `number_of_employees` | kolom pasangannya di `hrd.employees` |
| `VO_EMPLOYEE_PHOTO_URL` | `http://10.10.40.238:9090/photo?number_of_employee={nik}` | URL foto karyawan (`{nik}` `{id}` `{finger_id}`), dipakai kalau karyawan belum membuat avatar |
| `VO_ATTENDANCE_ENABLED` | `false` | status otomatis dari absensi |
| `VO_ATT_SOURCE` | `api` | `api` (web API JPayroll) atau `database` (tabel log mesin) |
| `VO_ATT_API_URL` | – | endpoint absensi harian JPayroll, dipanggil `GET {url}?date=Y-m-d` tiap 5 menit |
| `VO_ATT_API_DATE_PARAM` | `date` | nama parameter tanggal (kosongkan bila endpoint tidak memakainya) |
| `VO_ATT_API_TOKEN` / `VO_ATT_API_KEY_HEADER` | – | `Authorization: Bearer …` / header `X-API-KEY` bila API butuh login |
| `VO_ATT_API_LIST` | `data` | letak daftar baris di JSON (dot path; kosong = JSON langsung daftar) |
| `VO_ATT_API_FIELD_NIK` / `_IN` / `_OUT` / `_LEAVE` | `number_of_employees` / `time_in` / `time_out` / `leave_type` | nama kolom di tiap baris. Untuk log scan mentah (satu baris per scan): isi `_IN` dengan kolom waktu scan, kosongkan `_OUT` |
| `VO_ATT_CONNECTION` | `hrd` | (sumber `database`) koneksi database absensi |
| `VO_ATT_LOG_TABLE` / `_LOG_KEY` / `_LOG_TIME` | `attendance_logs` / `finger_id` / `scan_time` | tabel log mesin, kolom ID karyawan, kolom waktu scan |
| `VO_ATT_EMPLOYEE_KEY` | `finger_id` | kolom di `hrd.employees` yang sama dengan `_LOG_KEY` (`id`, `finger_id`, `number_of_employees`, …) |
| `VO_ATT_HOME_AFTER` | `16:00` | ≥ 2 scan dan scan terakhir setelah jam ini = sudah pulang |
| `VO_ATT_LEAVE_TABLE` (+ `_EMPLOYEE`, `_START`, `_END`, `_TYPE`) | – | tabel cuti/izin (opsional). Label: `cuti` → "Cuti", lainnya → "Tidak masuk hari ini" (ubah di `config/virtual-office.php`) |
| `REVERB_HOST` / `REVERB_PORT` | IP server / `8090` | alamat realtime yang dipakai browser karyawan (diisi `terapkan.ps1`) |

Setelah mengubah `.env`: `php artisan config:clear`. Untuk `REVERB_*`/`VITE_*`: juga `npm run build` dan restart task **HR One Reverb**.

## Editor Denah

Admin (role Admin HR One atau nama di `VO_ADMINS`) melihat tombol **Editor denah** di header lantai, atau buka
`http://IP-SERVER/virtual-office/editor`.

| Aksi | Cara |
|---|---|
| Tambah meja | Palet kiri → pilih zona → Meja tunggal / Meja kepala / Pasangan / Kelompok 2×3 |
| Tambah perabot | Palet kiri → Ruangan, Perabot, Peralatan |
| Pindah | Seret. Shift+klik untuk memilih banyak, atau "Pilih per zona" lalu seret satu kelompok |
| Putar | Tombol Putar 90° atau tombol **R** |
| Duplikat / hapus | Ctrl+D / Delete |
| Geser halus | Panah (Shift = 10 unit) |
| Urungkan | Ctrl+Z, ulangi Ctrl+Y |
| Atur karyawan | Klik meja → pilih nama, atau klik nama di "Belum punya meja" |
| Arah duduk | Kiri / Kanan / Atas / Bawah. Monitor, partisi, dan kursi ikut otomatis |
| Ubah ruangan | Hilangkan centang **Kunci ruangan**, lalu seret atau ubah ukurannya |
| Cek hasil | **Pratinjau 3D** |

- **Simpan draft**: menyimpan pekerjaan tanpa mengubah lantai. Draft bisa dibuka lagi nanti.
- **Publikasikan**: denah langsung berubah di layar semua karyawan yang sedang online.
- **Riwayat**: 15 versi terakhir yang pernah dipublikasikan. Buka versi lama lalu publikasikan untuk mengembalikannya.
- Meja yang bertumpuk ditandai garis merah.

### Tulisan zona

Tulisan "ZONA A", "ZONA B", dst. sekarang objek biasa di Editor Denah (palet **Ruangan → Tulisan zona**):
klik tulisannya untuk mengganti teks (maks. 40 huruf) dan ukuran huruf (Kecil/Sedang/Besar), seret untuk memindahkan,
Delete untuk menghapus. Denah lama otomatis mendapat tulisan zona di posisi semula saat editor dibuka;
tersimpan setelah **Publikasikan**. Tulisan zona tidak ikut pindah saat meja digeser.

## Cara kerja singkat

| Bagian | Cara kerja |
|---|---|
| Online/offline | Presence channel `vo.office`. User yang membuka halaman otomatis dianggap online. |
| Status & bubble | `PUT /virtual-office/status` → event `profile.updated` ke semua user. |
| Avatar | Foto di-crop di browser (256×256), di server di-encode ulang jadi JPG dengan GD. |
| Chat | Pesan dikirim ke channel pribadi tiap anggota `vo.user.{id}`. |
| Mengetik… | Whisper di channel `vo.conversation.{id}`, tidak disimpan ke database. |
| Bubble "Chat pribadi/grup" di lantai | Whisper `activity` di presence channel `vo.office` saat seseorang mengetik di kolom chat. Hilang saat pesan terkirim, kolom dikosongkan, atau 4 detik tidak ada ketikan. Untuk chat pribadi hanya tertulis "Chat pribadi" (tujuan tidak ditampilkan). |
| Lampiran | Disimpan privat di `storage/app/vo-attachments`, hanya anggota percakapan yang bisa membuka. |
| Lantai 3D | Digambar di `<canvas>` (`scene.js`). Karyawan berupa figur 3D yang duduk di kursinya dan dianimasikan ±15 fps (otomatis lebih rendah di PC lambat): online = mengetik, sibuk = mengetik cepat, rapat = mengangguk, offline = kursi kosong. Warna kulit/rambut/baju diambil dari avatar karakter. Animasi berhenti saat tab tidak aktif atau saat pengguna memilih "kurangi gerakan" di OS. |
| Bubble status bergiliran | Tiap bubble tampil 15 detik lalu sembunyi, muncul lagi setiap 1 menit (jadwal tiap orang digeser agar tidak serempak). Bubble yang baru diubah langsung tampil. Atur di `BUBBLE_SHOW_MS` dan `BUBBLE_CYCLE_MS` (`OfficeFloor.jsx`). |
| Ikon avatar | Muncul saat kursor diarahkan ke karyawan (atau saat dipilih / fokus keyboard / disentuh di HP). |

Event dikirim langsung (`ShouldBroadcastNow`), jadi **tidak perlu queue worker**.

## Kontrol lantai

- Klik kanan + geser: putar & miringkan
- Klik kanan sekali: menu tampilan (Isometrik, Tampak atas, Putar 90°, Zoom, Reset)
- Klik kiri + geser: geser lantai
- Scroll / tombol + −: zoom
- Layar sentuh: 1 jari geser, 2 jari zoom + putar

## Performa lantai 3D

- Perabot dan lantai digambar sekali per sudut pandang lalu disimpan sebagai gambar; saat animasi
  hanya area di sekitar figur karyawan yang digambar ulang.
- Putar/geser/zoom digabung maksimal 1x per frame layar; animasi berhenti sebentar selama lantai digerakkan.
- Animasi figur ±15 fps dan otomatis melambat (sampai ±8 fps) di komputer yang lambat; resolusi canvas
  turun ke 1x kalau menggambar penuh terus-menerus > 28 ms.
- Animasi berhenti saat tab tidak aktif atau lantai tidak terlihat di layar.
- Karyawan bisa mematikan animasi sendiri: klik kanan di lantai → **Animasi karyawan** (tersimpan di browser).
- Kalau masih berat: cek `chrome://gpu` → *Canvas* harus "Hardware accelerated". Di PC lama / Remote Desktop
  Chrome sering memakai mode software; aktifkan *Use graphics acceleration when available* di Settings Chrome.

## Menyesuaikan

- **Denah, meja, perabot, tulisan zona**: lewat Editor Denah, tanpa coding.
- **Jenis perabot baru**: `OBJECT_TYPES` (`catalog.js`), `OfficeObject::TYPES`, dan cara menggambarnya di `RENDER` (`scene.js`).
- **Warna**: konstanta `C` di `scene.js` dan variabel `--vo-*` di `virtual-office.css`.
- **Bubble bergiliran**: `BUBBLE_SHOW_MS` / `BUBBLE_CYCLE_MS` di `OfficeFloor.jsx`.
- **Sub-folder**: kalau HR One tidak di root domain, ubah `BASE` di `resources/js/VirtualOffice/api.js`.

## Belum termasuk

- Edit/hapus pesan, kelola anggota grup setelah dibuat
- Banyak lantai/ruangan
- Riwayat chat dicari (search) dan ekspor

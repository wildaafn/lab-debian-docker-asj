# Lab Debian Docker — ASJ XI TKJ

> Lab belajar interaktif untuk mempraktikkan administrasi Debian Server dengan Docker—ringan, terisolasi, dan mudah diulang.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-087ea4?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Static Export](https://img.shields.io/badge/deploy-static%20export-23a66f)](#deploy-ke-tencent-edgeone)

Website ini dibuat untuk pembelajaran **Administrasi Sistem Jaringan kelas XI TKJ**. Guru dapat mendemonstrasikan praktik melalui macOS, sedangkan siswa dapat mengikutinya menggunakan Windows 11 dan Docker Desktop tanpa harus menyiapkan banyak mesin virtual.

## Kenapa lab ini menarik?

- **Belajar seperti menyelesaikan misi** — setiap langkah, kuis, dan modul memberikan XP.
- **Progres tersimpan otomatis** — checklist, level, dan streak tersimpan di browser perangkat.
- **Perintah siap disalin** — setiap blok terminal memiliki tombol salin dan label lokasi eksekusi.
- **Checkpoint pengetahuan** — kuis singkat membantu siswa memahami alasan di balik perintah.
- **Aman untuk kelas** — seluruh layanan berjalan pada jaringan Docker terisolasi.
- **Responsif** — nyaman dipakai melalui laptop, tablet, maupun ponsel.

## Modul pembelajaran

| Modul | Topik | Hasil praktik |
| --- | --- | --- |
| 00 | Persiapan Docker Desktop | Docker Engine siap di macOS dan Windows 11 |
| 01 | Debian Client | Jaringan `lab-asj` dan client penguji |
| 02 | Web Server Apache | Situs Apache melalui port mapping |
| 03 | Database MariaDB | Database persisten dengan volume |
| 04 | FTP Server vsftpd | Akun dan simulasi upload file |
| 05 | DNS Server BIND9 | Zona, record A, dan MX lokal |
| 06 | Mail Server Lokal | SMTP dan IMAP untuk domain lab |
| 07 | DHCP Simulasi Aman | Konfigurasi dan validasi sintaks DHCP |
| 08 | Pengelolaan & Reset | Diagnosis, stop, start, dan reset lab |

## Menjalankan secara lokal

Persyaratan: Node.js 22 atau versi yang kompatibel dan npm.

```bash
git clone https://github.com/wildaafn/lab-debian-docker-asj.git
cd lab-debian-docker-asj
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Pemeriksaan sebelum deploy

```bash
npm run lint
npm run build
```

Build yang berhasil menghasilkan website statis di direktori `out`.

## Deploy ke Tencent EdgeOne

Hubungkan repository ini melalui dashboard EdgeOne Pages, kemudian gunakan konfigurasi berikut:

| Pengaturan | Nilai |
| --- | --- |
| Framework preset | `Next.js` |
| Build command | `npm run build` |
| Output directory | `out` |
| Root directory | `/` |
| Node.js version | `22` |
| Environment variable | `NEXT_PUBLIC_SITE_URL=https://domain-anda` |

Proyek menggunakan `output: "export"` pada `next.config.ts`, sehingga hasil akhirnya berupa aset statis dan tidak membutuhkan server Node.js saat runtime.

## Sistem progres siswa

Progres disimpan secara lokal melalui `localStorage`:

- langkah praktik: **20 XP**;
- checkpoint kuis: **50 XP**;
- modul selesai: **100 XP**;
- setiap **250 XP** menaikkan level.

Tidak ada akun siswa atau data pribadi yang dikirim ke server. Menghapus data situs/browser akan mereset progres pada perangkat tersebut.

## Catatan keamanan lab

Password pada materi adalah **kredensial contoh khusus jaringan lab**. Jangan memakainya pada server produksi atau akun pribadi.

Docker Desktop pada macOS dan Windows berjalan melalui VM/NAT. Praktik DHCP difokuskan pada instalasi, penulisan konfigurasi, dan validasi sintaks. **Jangan menjalankan DHCP server praktik pada LAN sekolah yang aktif**, karena dapat mengubah gateway dan DNS perangkat lain.

## Struktur proyek

```text
app/
├── data.ts       # Materi dan perintah seluruh modul
├── globals.css   # Tampilan, animasi, dan layout responsif
├── layout.tsx    # Metadata website
└── page.tsx      # Antarmuka serta interaksi belajar
next.config.ts    # Konfigurasi static export
```

## Lisensi dan penggunaan

Materi ini ditujukan untuk kegiatan belajar ASJ di **SMKS Islam 1 Kota Blitar**. Silakan gunakan dan kembangkan untuk kebutuhan pembelajaran dengan tetap memperhatikan keamanan jaringan sekolah.

---

Dibuat oleh **Wilda AFN** untuk pembelajaran ASJ XI TKJ.

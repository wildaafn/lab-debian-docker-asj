# Lab Debian Docker — ASJ XI-XII TKJ

> Lab belajar interaktif untuk mempraktikkan Administrasi Sistem Jaringan dengan Docker: ringan, terisolasi, bertahap, dan mudah diulang.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-087ea4?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Static Export](https://img.shields.io/badge/deploy-static%20export-23a66f)](#deploy-ke-tencent-edgeone)

Website ini dibuat untuk pembelajaran **Administrasi Sistem Jaringan kelas XI-XII TKJ**. Materi disusun mengikuti alur silabus ASJ: sistem operasi jaringan, DHCP, remote server, DNS, FTP, web server, database server, mail server, proxy server, control panel hosting, keamanan, dan troubleshooting.

## Kenapa lab ini menarik?

- **Belajar seperti menyelesaikan misi** — setiap langkah, kuis, dan modul memberikan XP.
- **Progres tersimpan otomatis** — checklist, level, dan streak tersimpan di browser perangkat.
- **Perintah siap disalin** — setiap blok terminal memiliki tombol salin dan label lokasi eksekusi.
- **Checkpoint pengetahuan** — kuis singkat membantu siswa memahami alasan di balik perintah.
- **Aman untuk kelas** — seluruh layanan berjalan pada jaringan Docker terisolasi.
- **Responsif** — nyaman dipakai melalui laptop, tablet, maupun ponsel.

## Catatan penting untuk siswa pemula

Siswa **tidak perlu menginstal Debian manual** seperti menginstal sistem operasi di VirtualBox. Lab ini memakai image `debian:12-slim`. Saat perintah `docker pull debian:12-slim` atau `docker run ... debian:12-slim` dijalankan, Docker akan mengambil template Debian kecil dari Docker Hub, lalu menjalankannya sebagai container.

Istilah dasar:

| Istilah | Arti singkat |
| --- | --- |
| Image | Template sistem, misalnya `debian:12-slim` |
| Container | Debian/server yang sedang berjalan dari image |
| Host | Laptop siswa/guru tempat Docker berjalan |
| Port mapping | Penghubung port laptop ke port container, contoh `8080:80` |
| Volume | Penyimpanan data agar tidak hilang saat container dibuat ulang |

## Opsi menjalankan Docker

Docker Desktop nyaman untuk pemula, tetapi bisa berat di laptop tertentu. Pilihan yang bisa dipakai:

| Opsi | Cocok untuk | Catatan |
| --- | --- | --- |
| Docker Desktop Windows/macOS | Kelas pemula | Paling mudah dipandu, sudah ada Docker Engine dan CLI |
| Docker Desktop backend WSL 2 | Windows 11 | Lebih baik daripada backend lama, tetap memakai aplikasi Docker Desktop |
| Docker Engine + CLI di WSL 2 | Windows yang ingin lebih ringan | Perlu setup lebih teknis oleh guru/admin |
| Docker Engine native Linux | Laptop Linux/lab komputer | Biasanya paling ringan dan stabil |
| Colima + Docker CLI | macOS | Alternatif ringan, cocok jika guru siap troubleshooting |

Docker CLI bukan pengganti Docker Engine. CLI hanya alat mengetik perintah `docker`; engine tetap harus berjalan melalui Docker Desktop, WSL 2, Linux native, atau Colima.

## Pemetaan silabus ASJ

| Kelas/Semester | Materi silabus | Modul di website |
| --- | --- | --- |
| XI Ganjil | Instalasi sistem operasi jaringan GUI/CLI | 00 Persiapan Docker, 01 Debian Client, 09 Instalasi Sistem Operasi Jaringan |
| XI Ganjil | DHCP Server | 07 DHCP Simulasi Aman |
| XI Ganjil | Remote Server SSH/Telnet | 10 Remote Server SSH dan Telnet |
| XI Genap | DNS Server | 05 DNS Server BIND9 |
| XI Genap | FTP Server | 04 FTP Server vsftpd |
| XI Genap | Web Server dan Database Server | 02 Web Server Apache, 03 Database MariaDB |
| XII | Mail Server | 06 Mail Server Lokal |
| XII | Proxy Server | 11 Proxy Server Squid |
| XII | Control Panel Hosting | 12 Control Panel Hosting |
| XII | Keamanan dan troubleshooting | 08 Pengelolaan & Reset, 13 Keamanan dan Troubleshooting Server |

## Modul pembelajaran

| Modul | Topik | Hasil praktik |
| --- | --- | --- |
| 00 | Persiapan Docker | Docker Engine siap dan siswa memahami image/container |
| 01 | Debian Client | Jaringan `lab-asj` dan client penguji Debian |
| 02 | Web Server Apache | Situs Apache melalui port mapping |
| 03 | Database MariaDB | Database persisten dengan volume |
| 04 | FTP Server vsftpd | Akun dan simulasi upload file |
| 05 | DNS Server BIND9 | Zona, record A, dan MX lokal |
| 06 | Mail Server Lokal | SMTP dan IMAP untuk domain lab |
| 07 | DHCP Simulasi Aman | Konfigurasi dan validasi sintaks DHCP |
| 08 | Pengelolaan & Reset | Diagnosis, stop, start, dan reset lab |
| 09 | Instalasi Sistem Operasi Jaringan | Perbandingan GUI/CLI dan simulasi Debian Server |
| 10 | Remote Server SSH dan Telnet | Login remote aman dengan SSH dan risiko Telnet |
| 11 | Proxy Server Squid | Caching, ACL, dan filtering sederhana |
| 12 | Control Panel Hosting | Konsep web, database, domain, email, dan backup hosting |
| 13 | Keamanan dan Troubleshooting Server | Log, port, koneksi, hardening, dan diagnosis |

## Menjalankan website secara lokal

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
├── curriculum.ts # Modul tambahan sesuai silabus ASJ XI-XII
├── data.ts       # Materi dan perintah modul inti Docker lab
├── globals.css   # Tampilan, animasi, dan layout responsif
├── layout.tsx    # Metadata website
└── page.tsx      # Antarmuka serta interaksi belajar
next.config.ts    # Konfigurasi static export
```

## Lisensi dan penggunaan

Materi ini ditujukan untuk kegiatan belajar ASJ di **SMKS Islam 1 Kota Blitar**. Silakan gunakan dan kembangkan untuk kebutuhan pembelajaran dengan tetap memperhatikan keamanan jaringan sekolah.

---

Dibuat oleh **Wilda Ariffatul Faisalnur, S.Kom** untuk pembelajaran ASJ XI-XII TKJ.

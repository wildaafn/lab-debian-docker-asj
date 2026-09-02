# Lab Debian Docker — ASJ XI TKJ

Website tutorial praktik Debian Server menggunakan Docker untuk guru pengguna macOS dan siswa pengguna Windows 11.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Build untuk Tencent EdgeOne Makers

```bash
npm run build
```

Konfigurasi EdgeOne:

- Framework: Next.js
- Build command: `npm run build`
- Output directory: `out`
- Node.js: 22 atau versi yang didukung EdgeOne

Project memakai `output: "export"` sehingga tidak membutuhkan server Node.js saat runtime.

## Catatan DHCP

Docker Desktop pada macOS dan Windows berjalan melalui VM/NAT. Praktik DHCP pada website difokuskan pada instalasi, penulisan konfigurasi, dan validasi sintaks. Jangan menjalankan DHCP server praktik pada LAN sekolah yang aktif.

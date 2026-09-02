import type { Module } from "./data";

export const curriculumModules: Module[] = [
  {
    id: "os-jaringan", number: "09", title: "Instalasi Sistem Operasi Jaringan", icon: "terminal", duration: "45 menit", level: "Dasar",
    summary: "Mengenal perbedaan instalasi server GUI dan CLI, lalu mensimulasikan Debian Server lewat container.",
    objectives: ["Membedakan GUI dan CLI", "Memahami alur instalasi OS jaringan", "Mengenal package manager", "Mengecek identitas sistem"],
    steps: [
      { title: "Pahami GUI dan CLI", description: "Server nyata biasanya memakai mode CLI agar ringan. GUI lebih mudah dilihat, tetapi memakan RAM dan CPU lebih besar. Di lab Docker, siswa berlatih Debian CLI yang mirip server produksi.", commands: [{ label: "Perbandingan", where: "Host", command: "GUI = tampilan grafis, cocok untuk desktop\nCLI = terminal teks, cocok untuk server\nServer ASJ biasanya dikelola lewat CLI" }] },
      { title: "Simulasi Debian Server", description: "Container Debian menggantikan instalasi manual untuk latihan perintah dasar. Ini membuat praktik cepat, aman, dan mudah diulang.", commands: [{ label: "Jalankan Debian latihan", where: "Host", command: "docker run -dit --name os-asj --hostname os-asj --network lab-asj --memory 256m debian:12-slim sleep infinity\ndocker exec -it os-asj bash" }] },
      { title: "Cek sistem dan repositori", description: "Siswa mengenali versi OS, user aktif, direktori kerja, dan cara memperbarui daftar paket.", commands: [{ label: "Perintah dasar", where: "Container", command: "cat /etc/os-release\nwhoami\npwd\nls /\napt update\nexit" }] },
      { title: "Bandingkan dengan instalasi nyata", description: "Pada server nyata, tahapnya adalah boot ISO, partisi disk, pilih paket, atur user, jaringan, lalu login. Pada lab ini tahap tersebut diringkas karena Docker sudah menyediakan sistem dasarnya.", note: "Guru tetap bisa menjelaskan instalasi Debian Server nyata lewat demo atau video, lalu praktik layanan dilakukan di container." },
    ], test: [{ label: "Validasi", where: "Host", command: "docker exec os-asj cat /etc/debian_version\ndocker ps --filter name=os-asj" }],
  },
  {
    id: "remote", number: "10", title: "Remote Server SSH dan Telnet", icon: "terminal", duration: "45 menit", level: "Menengah",
    summary: "Mengaktifkan akses remote ke container Debian dan membandingkan SSH yang aman dengan Telnet yang tidak terenkripsi.",
    objectives: ["Menginstal OpenSSH Server", "Membuat user remote", "Menguji login SSH", "Memahami risiko Telnet"],
    warning: "Telnet hanya untuk demonstrasi konsep. Jangan gunakan Telnet untuk akun nyata karena username dan password tidak terenkripsi.",
    steps: [
      { title: "Buat remote server", description: "Container ini menjadi server yang akan diakses dari host dan client-asj.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name remote-asj --hostname remote.sekolah.test --network lab-asj --ip 172.25.0.22 -p 2222:22 --memory 384m debian:12-slim sleep infinity\ndocker exec -it remote-asj bash" }] },
      { title: "Instal SSH server", description: "OpenSSH dipakai untuk remote server secara aman. Buat user siswa agar tidak memakai root.", commands: [{ label: "Setup SSH", where: "Container", command: "apt update\napt install -y openssh-server sudo nano iproute2\nuseradd -m -s /bin/bash siswa\necho 'siswa:BelajarSSH2026!' | chpasswd\nmkdir -p /run/sshd\n/usr/sbin/sshd\nexit" }] },
      { title: "Uji login SSH", description: "Port 2222 di laptop host diteruskan ke port 22 di container. Dari container client, akses langsung ke IP lab.", commands: [{ label: "Dari host", where: "Host", command: "ssh siswa@localhost -p 2222" }, { label: "Dari client", where: "Host", command: "docker exec -it client-asj ssh siswa@172.25.0.22" }] },
      { title: "Demonstrasi Telnet", description: "Telnet ditunjukkan agar siswa memahami mengapa protokol lama berbahaya untuk login server.", commands: [{ label: "Pasang client telnet", where: "Host", command: "docker exec client-asj apt install -y telnet" }], note: "Untuk praktik utama, gunakan SSH. Telnet cukup dibahas sebagai perbandingan keamanan." },
    ], test: [{ label: "Cek port SSH", where: "Host", command: "docker exec client-asj nc -vz 172.25.0.22 22" }],
  },
  {
    id: "proxy", number: "11", title: "Proxy Server Squid", icon: "shield", duration: "45 menit", level: "Menengah",
    summary: "Membangun proxy lokal untuk memahami caching, pembatasan akses, dan filtering sederhana.",
    objectives: ["Menginstal Squid", "Mengatur ACL jaringan lab", "Menguji akses lewat proxy", "Menerapkan blokir domain contoh"],
    steps: [
      { title: "Buat proxy server", description: "Squid berjalan pada port 3128 dan hanya dipakai di jaringan lab.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name proxy-asj --hostname proxy.sekolah.test --network lab-asj --ip 172.25.0.88 -p 3128:3128 --memory 384m debian:12-slim sleep infinity\ndocker exec -it proxy-asj bash" }] },
      { title: "Instal Squid", description: "Paket Squid menyediakan layanan proxy HTTP untuk latihan manajemen akses.", commands: [{ label: "Instal", where: "Container", command: "apt update\napt install -y squid nano\ncp /etc/squid/squid.conf /etc/squid/squid.conf.bak" }] },
      { title: "Izinkan jaringan lab", description: "ACL menentukan siapa yang boleh memakai proxy. Pada lab ini hanya subnet Docker lab-asj yang diizinkan.", commands: [{ label: "Konfigurasi dasar", where: "Container", command: "cat > /etc/squid/squid.conf <<'EOF'\nhttp_port 3128\nacl lab_asj src 172.25.0.0/24\nacl blokir dstdomain .example.com\nhttp_access deny blokir\nhttp_access allow lab_asj\nhttp_access deny all\naccess_log /var/log/squid/access.log\nEOF\nsquid -k parse\nservice squid start\nexit" }] },
      { title: "Uji dari client", description: "Client mengakses web melalui proxy. Jika domain masuk daftar blokir, akses ditolak oleh Squid.", commands: [{ label: "Tes proxy", where: "Host", command: "docker exec client-asj curl -x http://172.25.0.88:3128 http://example.org -I\ndocker exec client-asj curl -x http://172.25.0.88:3128 http://example.com -I" }] },
    ], test: [{ label: "Log proxy", where: "Host", command: "docker exec proxy-asj tail -n 20 /var/log/squid/access.log" }],
  },
  {
    id: "hosting-panel", number: "12", title: "Control Panel Hosting", icon: "web", duration: "40 menit", level: "Menengah",
    summary: "Mengenal konsep control panel hosting melalui simulasi layanan web, database, domain, dan backup.",
    objectives: ["Memahami fungsi cPanel/CyberPanel", "Menghubungkan web dan database", "Mengenal virtual host", "Membuat backup sederhana"],
    steps: [
      { title: "Pahami peran control panel", description: "Control panel hosting adalah antarmuka untuk membuat website, database, domain, akun FTP, SSL, email, dan backup. Di lab Docker, siswa memahami komponennya melalui layanan yang sudah dibuat satu per satu.", commands: [{ label: "Komponen hosting", where: "Host", command: "Web server  = Apache/Nginx\nDatabase    = MariaDB/MySQL\nDNS         = domain dan record\nFTP/SFTP    = upload file\nMail server = email domain\nBackup      = salinan data" }] },
      { title: "Simulasi virtual host", description: "Siswa melihat bahwa satu server web bisa melayani lebih dari satu nama domain lokal.", commands: [{ label: "Virtual host contoh", where: "Host", command: "docker exec -it web-asj bash\nmkdir -p /var/www/sekolah\necho '<h1>Hosting Sekolah</h1>' > /var/www/sekolah/index.html\nprintf '%s\\n' '<VirtualHost *:80>' 'ServerName hosting.sekolah.test' 'DocumentRoot /var/www/sekolah' '</VirtualHost>' > /etc/apache2/sites-available/hosting.conf\na2ensite hosting.conf\napachectl graceful\nexit" }] },
      { title: "Backup file website", description: "Backup sederhana dibuat dengan tar agar siswa memahami prinsip pencadangan sebelum memakai control panel sungguhan.", commands: [{ label: "Backup", where: "Host", command: "docker exec web-asj tar -czf /tmp/backup-web-asj.tar.gz /var/www/html /var/www/sekolah\ndocker cp web-asj:/tmp/backup-web-asj.tar.gz ./backup-web-asj.tar.gz\nls -lh backup-web-asj.tar.gz" }] },
      { title: "Hubungkan dengan EdgeOne", description: "Untuk website statis seperti materi ini, EdgeOne Pages berperan sebagai platform hosting. Siswa bisa membandingkan hosting modern berbasis Git dengan control panel tradisional.", note: "Bagian ini cocok untuk diskusi kelas: cPanel/CyberPanel mengelola server, sedangkan EdgeOne Pages/Vercel/Netlify mengelola deploy dari Git." },
    ], test: [{ label: "Cek backup", where: "Host", command: "ls -lh backup-web-asj.tar.gz" }],
  },
  {
    id: "security-troubleshooting", number: "13", title: "Keamanan dan Troubleshooting Server", icon: "shield", duration: "50 menit", level: "Penting",
    summary: "Menganalisis masalah layanan, membaca log, mengecek port, dan menerapkan hardening dasar server.",
    objectives: ["Membaca log layanan", "Mengecek port aktif", "Menguji koneksi antar-container", "Menerapkan prinsip hardening dasar"],
    warning: "Perintah keamanan di modul ini untuk lingkungan lab. Jangan menutup port atau menghapus konfigurasi server produksi tanpa rencana rollback.",
    steps: [
      { title: "Cek status semua container", description: "Troubleshooting dimulai dari melihat container mana yang hidup, berhenti, atau restart terus-menerus.", commands: [{ label: "Status global", where: "Host", command: "docker ps -a\ndocker stats --no-stream" }] },
      { title: "Baca log layanan", description: "Log memberi petunjuk kesalahan konfigurasi, port bentrok, password salah, atau service belum berjalan.", commands: [{ label: "Log container", where: "Host", command: "docker logs web-asj\ndocker logs db-asj\ndocker logs dns-asj" }] },
      { title: "Cek port dan koneksi", description: "Gunakan nc, curl, dig, dan ping untuk membedakan masalah jaringan, DNS, dan aplikasi.", commands: [{ label: "Tes koneksi", where: "Host", command: "docker exec client-asj ping -c 2 172.25.0.80\ndocker exec client-asj nc -vz 172.25.0.80 80\ndocker exec client-asj dig @172.25.0.53 web.sekolah.test +short\ndocker exec client-asj curl http://172.25.0.80" }] },
      { title: "Hardening dasar", description: "Siswa mengenal praktik dasar: password kuat, user non-root, update paket, batasi layanan yang terbuka, dan backup sebelum perubahan besar.", commands: [{ label: "Checklist hardening", where: "Host", command: "1. Gunakan password kuat dan unik\n2. Jangan login root untuk pekerjaan harian\n3. Jalankan apt update sebelum instal paket\n4. Buka hanya port yang dibutuhkan\n5. Backup konfigurasi sebelum diedit\n6. Baca log sebelum menghapus container" }] },
    ], test: [{ label: "Diagnosis cepat", where: "Host", command: "docker ps -a\ndocker network inspect lab-asj\ndocker system df" }],
  },
];

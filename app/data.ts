export type CommandBlock = {
  label: string;
  command: string;
  where?: "Host" | "Container" | "PowerShell / Terminal";
};

export type Step = {
  title: string;
  description: string;
  commands?: CommandBlock[];
  note?: string;
};

export type Module = {
  id: string;
  number: string;
  title: string;
  summary: string;
  duration: string;
  level: "Dasar" | "Menengah" | "Penting";
  icon: string;
  objectives: string[];
  steps: Step[];
  test?: CommandBlock[];
  warning?: string;
};

export const modules: Module[] = [
  {
    id: "persiapan", number: "00", title: "Persiapan Docker", icon: "setup", duration: "35 menit", level: "Dasar",
    summary: "Memahami Docker dari nol, menyiapkan Docker Engine, dan memilih mode yang paling ringan untuk komputer siswa.",
    objectives: ["Memahami image, container, host, dan port", "Memastikan Docker Engine aktif", "Mengetahui pilihan Docker Desktop, Docker CLI, WSL 2, dan Linux native", "Mengatur resource agar komputer tetap ringan"],
    steps: [
      { title: "Pahami dulu istilah dasarnya", description: "Docker dipakai untuk menjalankan Debian kecil di dalam container. Siswa tidak perlu menginstal Debian manual seperti instal OS di VirtualBox. Docker akan mengunduh image Debian, lalu membuat container dari image itu.", commands: [{ label: "Analogi singkat", where: "Host", command: "Image     = template sistem, contoh: debian:12-slim\nContainer = Debian yang sedang berjalan dari image\nHost      = laptop siswa/guru\nPort      = pintu akses layanan, contoh 8080 -> 80" }], note: "Kalau perintah docker run memakai debian:12-slim dan image belum ada, Docker otomatis download saat pertama kali dijalankan." },
      { title: "Pilihan instalasi yang disarankan", description: "Untuk kelas pemula, Docker Desktop paling mudah karena sudah membawa Docker Engine dan Docker CLI. Jika laptop berat, siswa tetap bisa memakai Docker CLI dari terminal, tetapi tetap membutuhkan engine. Opsi paling ringan biasanya Linux native; untuk Windows bisa memakai WSL 2 dengan Docker Engine atau Docker Desktop backend WSL 2.", commands: [{ label: "Pilih jalur", where: "PowerShell / Terminal", command: "Opsi A - Pemula Windows/macOS: Docker Desktop\nOpsi B - Windows lebih ringan: WSL 2 + Docker CLI/Engine\nOpsi C - Paling ringan: Linux native + Docker Engine\nOpsi D - macOS alternatif: Colima + Docker CLI" }], note: "Docker CLI bukan pengganti engine. CLI hanya alat mengetik perintah; engine tetap harus berjalan di Docker Desktop, WSL 2, Linux, atau Colima." },
      { title: "Instal di Windows 11 dengan Docker Desktop", description: "Aktifkan virtualisasi di BIOS/UEFI, aktifkan WSL 2, instal Docker Desktop, lalu pastikan status Docker Desktop sudah Engine running sebelum mengetik perintah lab.", commands: [{ label: "Cek WSL dan Docker", where: "PowerShell / Terminal", command: "wsl --status\ndocker --version\ndocker info\ndocker run --rm hello-world" }], note: "Jika docker info error, biasanya Docker Desktop belum dibuka, WSL belum aktif, atau virtualisasi BIOS belum menyala." },
      { title: "Instal di macOS guru", description: "Unduh Docker Desktop sesuai prosesor Mac, pasang ke Applications, buka aplikasinya, lalu tunggu hingga Docker Engine running.", commands: [{ label: "Verifikasi", where: "Host", command: "docker --version\ndocker info\ndocker run --rm hello-world" }] },
      { title: "Opsi Docker CLI tanpa tampilan berat", description: "Jika Docker Desktop terasa lambat, gunakan terminal untuk semua praktik. Pada Windows, buka PowerShell atau terminal WSL. Pada Linux, cukup gunakan Docker Engine dan Docker CLI. Pada macOS, Colima dapat dipakai sebagai alternatif ringan jika guru sudah siap mengelolanya.", commands: [{ label: "Contoh Linux/WSL", where: "PowerShell / Terminal", command: "docker version\ndocker ps\ndocker images" }, { label: "Contoh macOS dengan Colima", where: "Host", command: "brew install colima docker\ncolima start --cpu 2 --memory 3\ndocker info" }], note: "Untuk kelas besar, Docker Desktop lebih mudah didukung. Untuk laptop rendah spesifikasi, Linux native atau WSL 2 dengan resource kecil biasanya lebih responsif." },
      { title: "Batasi resource agar tidak lemot", description: "Di Docker Desktop > Settings > Resources, mulai dengan 2 CPU dan RAM 2-4 GB. Tutup aplikasi berat saat praktik agar laptop siswa tidak penuh RAM.", commands: [{ label: "Cek penggunaan", where: "PowerShell / Terminal", command: "docker system df\ndocker ps -a" }], note: "Jangan menjalankan VirtualBox bersamaan dengan Docker Desktop saat praktik, karena keduanya memakai virtualisasi dan RAM besar." },
    ], test: [{ label: "Tes akhir persiapan", where: "PowerShell / Terminal", command: "docker --version\ndocker info\ndocker run --rm debian:12-slim cat /etc/debian_version" }],
  },
  {
    id: "debian", number: "01", title: "Debian Client", icon: "terminal", duration: "40 menit", level: "Dasar",
    summary: "Membuat jaringan lab dan Debian client yang dipakai untuk menguji semua server, tanpa instal Debian manual.",
    objectives: ["Mengunduh image Debian otomatis", "Membuat bridge network", "Menjalankan Debian 12 Slim", "Masuk ke shell container", "Memasang alat diagnosis jaringan"],
    steps: [
      { title: "Pastikan Docker siap", description: "Sebelum membuat Debian client, pastikan perintah docker bisa berjalan. Jika perintah ini gagal, jangan lanjut ke modul berikutnya dulu.", commands: [{ label: "Cek engine", where: "Host", command: "docker info\ndocker ps" }], note: "Di Windows, jalankan dari PowerShell atau terminal WSL. Di macOS, jalankan dari Terminal." },
      { title: "Download image Debian", description: "Kita tidak menginstal Debian seperti OS biasa. Perintah pull hanya mengambil template Debian kecil dari Docker Hub. Nanti container dibuat dari template ini.", commands: [{ label: "Ambil image", where: "Host", command: "docker pull debian:12-slim\ndocker images" }], note: "Jika lupa menjalankan docker pull, tidak masalah. Docker run akan mengunduh image otomatis saat pertama kali dipakai." },
      { title: "Buat jaringan praktik", description: "Semua server lab akan berkomunikasi dalam subnet yang sama. Jaringan ini terisolasi dari LAN sekolah sehingga aman untuk latihan DNS, mail, dan simulasi DHCP.", commands: [{ label: "Buat network", where: "Host", command: "docker network create --driver bridge --subnet 172.25.0.0/24 lab-asj" }, { label: "Periksa", where: "Host", command: "docker network inspect lab-asj" }] },
      { title: "Jalankan Debian client", description: "Container client-asj adalah Debian kecil yang terus menyala untuk menguji server lain. Batas RAM dan CPU menjaga komputer siswa tetap responsif.", commands: [{ label: "Buat container", where: "Host", command: "docker run -dit --name client-asj --hostname client-asj --network lab-asj --ip 172.25.0.10 --memory 384m --cpus 0.5 debian:12-slim sleep infinity" }, { label: "Cek status", where: "Host", command: "docker ps\ndocker inspect client-asj --format '{{.State.Status}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'" }] },
      { title: "Masuk ke Debian", description: "Perintah docker exec membuka shell bash di dalam container. Prompt terminal akan berubah karena sekarang siswa berada di Debian container, bukan langsung di laptop host.", commands: [{ label: "Masuk", where: "Host", command: "docker exec -it client-asj bash" }, { label: "Cek identitas Debian", where: "Container", command: "cat /etc/os-release\nhostname\nip address" }] },
      { title: "Pasang alat pengujian", description: "Debian slim sengaja sangat kecil, jadi banyak alat jaringan belum tersedia. Pasang ping, curl, DNS tools, FTP client, telnet, netcat, dan MariaDB client.", commands: [{ label: "Di dalam Debian", where: "Container", command: "apt update\napt install -y iproute2 iputils-ping curl dnsutils netcat-openbsd telnet lftp mariadb-client\nip address\nexit" }] },
      { title: "Latihan keluar, masuk, stop, dan start", description: "Siswa perlu tahu bahwa container bisa dihentikan dan dijalankan lagi tanpa membuat ulang dari awal.", commands: [{ label: "Kelola container", where: "Host", command: "docker stop client-asj\ndocker start client-asj\ndocker exec -it client-asj bash" }], note: "Gunakan exit untuk keluar dari shell container. Jangan memakai docker rm kecuali memang ingin menghapus container." },
    ], test: [{ label: "Status", where: "Host", command: "docker ps\ndocker inspect client-asj" }, { label: "Tes dari dalam Debian", where: "Host", command: "docker exec client-asj cat /etc/debian_version\ndocker exec client-asj ping -c 2 172.25.0.10" }],
  },
  {
    id: "web", number: "02", title: "Web Server Apache", icon: "web", duration: "30 menit", level: "Dasar",
    summary: "Menginstal Apache pada Debian dan menerbitkan halaman melalui port 8080.",
    objectives: ["Memahami port mapping", "Menginstal Apache", "Menguji dari browser dan client"],
    steps: [
      { title: "Buat server", description: "Port 8080 pada host diteruskan ke port 80 milik container.", commands: [{ label: "Jalankan", where: "Host", command: "docker run -dit --name web-asj --hostname web.sekolah.test --network lab-asj --ip 172.25.0.80 -p 8080:80 --memory 384m debian:12-slim sleep infinity" }] },
      { title: "Instal Apache", description: "Masuk ke container dan instal paket web server.", commands: [{ label: "Masuk dan instal", where: "Host", command: "docker exec -it web-asj bash" }, { label: "Instal", where: "Container", command: "apt update\napt install -y apache2 curl nano" }] },
      { title: "Buat halaman", description: "Ganti nama siswa sesuai identitas masing-masing.", commands: [{ label: "Konten", where: "Container", command: "echo '<h1>Web Server ASJ XI TKJ</h1><p>Nama: Siswa 01</p>' > /var/www/html/index.html\napachectl start\napachectl -S\nexit" }] },
    ], test: [{ label: "Dari host", where: "Host", command: "curl http://localhost:8080" }, { label: "Dari client", where: "Host", command: "docker exec client-asj curl http://172.25.0.80" }],
  },
  {
    id: "database", number: "03", title: "Database MariaDB", icon: "database", duration: "35 menit", level: "Menengah",
    summary: "Menjalankan MariaDB dengan volume persisten, database, tabel, dan user siswa.",
    objectives: ["Memahami volume", "Membuat tabel dan data", "Menguji koneksi remote"],
    steps: [
      { title: "Buat volume", description: "Volume menjaga data tetap ada saat container dihapus dan dibuat ulang.", commands: [{ label: "Volume", where: "Host", command: "docker volume create data-db-asj" }] },
      { title: "Jalankan MariaDB", description: "Gunakan password ini hanya untuk jaringan lab.", commands: [{ label: "Server database", where: "Host", command: "docker run -d --name db-asj --hostname db.sekolah.test --network lab-asj --ip 172.25.0.100 -p 3307:3306 --memory 512m -e MARIADB_ROOT_PASSWORD=RootASJ2026! -e MARIADB_DATABASE=sekolah -e MARIADB_USER=siswa -e MARIADB_PASSWORD=SiswaASJ2026! -v data-db-asj:/var/lib/mysql mariadb:11" }, { label: "Pantau log", where: "Host", command: "docker logs -f db-asj" }] },
      { title: "Buat tabel", description: "Tekan Ctrl+C setelah ready for connections, lalu masuk sebagai root.", commands: [{ label: "Masuk MariaDB", where: "Host", command: "docker exec -it db-asj mariadb -u root -p" }, { label: "SQL", where: "Container", command: "USE sekolah;\nCREATE TABLE siswa (id INT AUTO_INCREMENT PRIMARY KEY, nama VARCHAR(100), kelas VARCHAR(20));\nINSERT INTO siswa (nama, kelas) VALUES ('Budi', 'XI TKJ 1');\nSELECT * FROM siswa;\nEXIT;" }] },
    ], test: [{ label: "Koneksi client", where: "Host", command: "docker exec -it client-asj mariadb -h 172.25.0.100 -u siswa -p sekolah" }],
  },
  {
    id: "ftp", number: "04", title: "FTP Server vsftpd", icon: "folder", duration: "35 menit", level: "Menengah",
    summary: "Membuat akun FTP dan menguji upload file pada jaringan container.",
    objectives: ["Menginstal vsftpd", "Membuat user FTP", "Melakukan upload dengan lftp"],
    steps: [
      { title: "Buat FTP server", description: "Port pasif disediakan untuk latihan koneksi FTP.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name ftp-asj --hostname ftp.sekolah.test --network lab-asj --ip 172.25.0.21 -p 2121:21 -p 30000-30009:30000-30009 --memory 384m debian:12-slim sleep infinity" }] },
      { title: "Instal dan buat akun", description: "Akun ftpuser akan dibatasi di direktori home miliknya.", commands: [{ label: "Masuk", where: "Host", command: "docker exec -it ftp-asj bash" }, { label: "Instal", where: "Container", command: "apt update\napt install -y vsftpd nano\nuseradd -m -s /bin/bash ftpuser\necho 'ftpuser:BelajarFTP2026!' | chpasswd\nmkdir -p /home/ftpuser/ftp/upload\nchown -R ftpuser:ftpuser /home/ftpuser/ftp" }] },
      { title: "Konfigurasi dan mulai", description: "Mode pasif membantu koneksi melalui port mapping.", commands: [{ label: "Konfigurasi", where: "Container", command: "printf '%s\\n' 'listen=YES' 'listen_ipv6=NO' 'anonymous_enable=NO' 'local_enable=YES' 'write_enable=YES' 'local_umask=022' 'chroot_local_user=YES' 'allow_writeable_chroot=YES' 'pasv_enable=YES' 'pasv_min_port=30000' 'pasv_max_port=30009' > /etc/vsftpd.conf\nvsftpd /etc/vsftpd.conf &\nexit" }] },
    ], test: [{ label: "Upload dari client", where: "Host", command: "docker exec -it client-asj lftp -u ftpuser,BelajarFTP2026! ftp://172.25.0.21" }],
  },
  {
    id: "dns", number: "05", title: "DNS Server BIND9", icon: "dns", duration: "45 menit", level: "Menengah",
    summary: "Membuat zona sekolah.test beserta record web, FTP, mail, database, dan MX.",
    objectives: ["Memahami zona DNS", "Membuat record A dan MX", "Menguji dengan dig"],
    steps: [
      { title: "Buat dan instal DNS", description: "Port 1053 host dipakai agar tidak berbenturan dengan DNS sistem.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name dns-asj --hostname ns1.sekolah.test --network lab-asj --ip 172.25.0.53 -p 1053:53/udp -p 1053:53/tcp --memory 384m debian:12-slim sleep infinity\ndocker exec -it dns-asj bash" }, { label: "Instal", where: "Container", command: "apt update\napt install -y bind9 bind9-utils dnsutils nano" }] },
      { title: "Daftarkan zona", description: "Tambahkan zona master sekolah.test.", commands: [{ label: "named.conf.local", where: "Container", command: "cat >> /etc/bind/named.conf.local <<'EOF'\nzone \"sekolah.test\" {\n  type master;\n  file \"/etc/bind/db.sekolah.test\";\n};\nEOF" }] },
      { title: "Buat record", description: "Serial harus dinaikkan setiap kali file zona diubah.", commands: [{ label: "File zona", where: "Container", command: "cat > /etc/bind/db.sekolah.test <<'EOF'\n$TTL 86400\n@ IN SOA ns1.sekolah.test. admin.sekolah.test. (\n  2026090101 3600 1800 604800 86400 )\n@    IN NS ns1.sekolah.test.\nns1  IN A  172.25.0.53\nweb  IN A  172.25.0.80\nftp  IN A  172.25.0.21\nmail IN A  172.25.0.25\ndb   IN A  172.25.0.100\n@    IN MX 10 mail.sekolah.test.\nEOF\nnamed-checkconf\nnamed-checkzone sekolah.test /etc/bind/db.sekolah.test\nnamed -g -c /etc/bind/named.conf &\nexit" }] },
    ], test: [{ label: "Record A dan MX", where: "Host", command: "docker exec client-asj dig @172.25.0.53 web.sekolah.test +short\ndocker exec client-asj dig @172.25.0.53 sekolah.test MX +short" }],
  },
  {
    id: "mail", number: "06", title: "Mail Server Lokal", icon: "mail", duration: "50 menit", level: "Menengah",
    summary: "Mengirim email lokal sekolah.test dengan Postfix dan membaca mailbox pengguna.",
    objectives: ["Menginstal Postfix dan Dovecot", "Membuat pengguna mail", "Menguji SMTP dan IMAP"],
    warning: "Lab lokal saja. Jangan membuka SMTP ke Internet atau mencoba mengirim ke Gmail/Yahoo.",
    steps: [
      { title: "Buat mail server", description: "SMTP host memakai 2525 dan IMAP memakai 1143.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name mail-asj --hostname mail.sekolah.test --network lab-asj --ip 172.25.0.25 -p 2525:25 -p 1143:143 --memory 512m debian:12-slim sleep infinity\ndocker exec -it mail-asj bash" }] },
      { title: "Instal layanan", description: "Konfigurasi awal Postfix dibuat noninteraktif.", commands: [{ label: "Instal", where: "Container", command: "export DEBIAN_FRONTEND=noninteractive\necho 'postfix postfix/mailname string sekolah.test' | debconf-set-selections\necho 'postfix postfix/main_mailer_type string Internet Site' | debconf-set-selections\napt update\napt install -y postfix dovecot-imapd mailutils nano" }] },
      { title: "Atur Postfix", description: "Jaringan 172.25.0.0/24 diizinkan mengirim email lokal.", commands: [{ label: "postconf", where: "Container", command: "postconf -e 'myhostname = mail.sekolah.test'\npostconf -e 'mydomain = sekolah.test'\npostconf -e 'myorigin = $mydomain'\npostconf -e 'inet_interfaces = all'\npostconf -e 'mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain'\npostconf -e 'home_mailbox = Maildir/'\npostconf -e 'mynetworks = 127.0.0.0/8 172.25.0.0/24'" }] },
      { title: "Buat user dan mulai", description: "Dua akun dipakai untuk simulasi pengirim dan penerima.", commands: [{ label: "User dan service", where: "Container", command: "useradd -m -s /bin/bash budi\necho 'budi:BelajarMail2026!' | chpasswd\nuseradd -m -s /bin/bash ani\necho 'ani:BelajarMail2026!' | chpasswd\nmkdir -p /home/budi/Maildir/{cur,new,tmp} /home/ani/Maildir/{cur,new,tmp}\nchown -R budi:budi /home/budi/Maildir\nchown -R ani:ani /home/ani/Maildir\npostfix start\ndovecot\nexit" }] },
    ], test: [{ label: "Kirim lokal", where: "Host", command: "docker exec mail-asj bash -c \"echo 'Halo Ani dari praktik ASJ' | mail -s 'Tes Mail Server' ani@sekolah.test\"" }, { label: "Cek port", where: "Host", command: "docker exec client-asj nc -vz 172.25.0.25 25\ndocker exec client-asj nc -vz 172.25.0.25 143" }],
  },
  {
    id: "dhcp", number: "07", title: "DHCP — Simulasi Aman", icon: "dhcp", duration: "30 menit", level: "Penting",
    summary: "Mempelajari konfigurasi DHCP tanpa mengganggu jaringan sekolah.",
    objectives: ["Menginstal ISC DHCP Server", "Menentukan range, gateway, dan DNS", "Memvalidasi konfigurasi"],
    warning: "Jangan mengaktifkan DHCP praktik pada LAN sekolah. Dua DHCP server dapat mengacaukan gateway dan DNS seluruh kelas.",
    steps: [
      { title: "Buat container", description: "Container tetap berada pada jaringan lab terisolasi.", commands: [{ label: "Container DHCP", where: "Host", command: "docker run -dit --name dhcp-asj --hostname dhcp.sekolah.test --network lab-asj --memory 256m --cap-add NET_ADMIN debian:12-slim sleep infinity\ndocker exec -it dhcp-asj bash" }] },
      { title: "Instal dan konfigurasi", description: "Range contoh berada di 172.25.0.150–180.", commands: [{ label: "Instal", where: "Container", command: "apt update\napt install -y isc-dhcp-server iproute2 nano" }, { label: "dhcpd.conf", where: "Container", command: "cat > /etc/dhcp/dhcpd.conf <<'EOF'\nauthoritative;\ndefault-lease-time 600;\nmax-lease-time 7200;\noption domain-name \"sekolah.test\";\noption domain-name-servers 172.25.0.53;\nsubnet 172.25.0.0 netmask 255.255.255.0 {\n  range 172.25.0.150 172.25.0.180;\n  option routers 172.25.0.1;\n  option broadcast-address 172.25.0.255;\n}\nEOF" }] },
      { title: "Validasi", description: "Exit code 0 menandakan sintaks valid. Docker Desktop tidak meneruskan broadcast DHCP ke LAN fisik.", commands: [{ label: "Periksa sintaks", where: "Container", command: "dhcpd -t -cf /etc/dhcp/dhcpd.conf\necho $?\nexit" }], note: "Uji lease nyata dilakukan guru pada Linux native dengan switch terisolasi." },
    ], test: [{ label: "Validasi ulang", where: "Host", command: "docker exec dhcp-asj dhcpd -t -cf /etc/dhcp/dhcpd.conf" }],
  },
  {
    id: "pengelolaan", number: "08", title: "Pengelolaan & Reset", icon: "shield", duration: "15 menit", level: "Penting",
    summary: "Menghentikan, melanjutkan, mendiagnosis, dan mereset lab dengan aman.",
    objectives: ["Menjaga pekerjaan siswa", "Mendiagnosis error", "Melakukan reset terkontrol"],
    warning: "Jangan menjalankan docker system prune -a --volumes pada komputer siswa tanpa pemeriksaan dan backup.",
    steps: [
      { title: "Hentikan tanpa menghapus", description: "Gunakan stop saat jam praktik selesai.", commands: [{ label: "Stop", where: "Host", command: "docker stop client-asj web-asj db-asj ftp-asj dns-asj mail-asj dhcp-asj" }, { label: "Lanjutkan", where: "Host", command: "docker start client-asj web-asj db-asj ftp-asj dns-asj mail-asj dhcp-asj" }] },
      { title: "Diagnosis", description: "Periksa status, log, ukuran, dan jaringan sebelum menghapus apa pun.", commands: [{ label: "Diagnosis aman", where: "Host", command: "docker ps -a\ndocker system df\ndocker logs NAMA_CONTAINER\ndocker network inspect lab-asj" }] },
      { title: "Reset setelah penilaian", description: "Perintah berikut menghapus container lab; volume database dihapus terpisah.", commands: [{ label: "Hapus container", where: "Host", command: "docker rm -f client-asj web-asj db-asj ftp-asj dns-asj mail-asj dhcp-asj\ndocker network rm lab-asj" }, { label: "Opsional: hapus data DB", where: "Host", command: "docker volume rm data-db-asj" }] },
    ],
  },
];

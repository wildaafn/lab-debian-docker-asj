export type CommandBlock = {
  label: string;
  command: string;
  explanation?: string;
  where?: "Host" | "Container" | "PowerShell / Terminal";
};

export type Step = {
  title: string;
  description: string;
  commands?: CommandBlock[];
  note?: string;
};

export type ConceptPoint = {
  term: string;
  desc: string;
};

export type ConceptTheory = {
  title: string;
  summary: string;
  points: ConceptPoint[];
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
  theory?: ConceptTheory;
  steps: Step[];
  test?: CommandBlock[];
  warning?: string;
};

export const modules: Module[] = [
  {
    id: "persiapan",
    number: "00",
    title: "Persiapan Docker",
    icon: "setup",
    duration: "35 menit",
    level: "Dasar",
    summary: "Memahami Docker dari nol, menyiapkan Docker Engine, dan memilih mode yang paling ringan untuk komputer siswa.",
    objectives: ["Memahami image, container, host, dan port", "Memastikan Docker Engine aktif", "Mengetahui pilihan Docker Desktop, Docker CLI, WSL 2, dan Linux native", "Mengatur resource agar komputer tetap ringan"],
    theory: {
      title: "Apa itu Docker & Mengapa Digunakan di Lab ASJ?",
      summary: "Docker adalah platform virtualisasi tingkat sistem operasi (containerization) yang memungkinkan kita menjalankan sistem Linux mini tanpa perlu menginstal OS secara penuh di VirtualBox.",
      points: [
        { term: "Docker vs Virtual Machine (VM)", desc: "VM membutuhkan instalasi OS lengkap (10-20 GB) dan memakan RAM besar. Docker hanya mengemas aplikasi dan dependensi dasarnya (~80 MB), berjalan langsung di atas kernel host, sehingga sangat ringan dan cepat menyala dalam 1 detik." },
        { term: "Docker Image", desc: "Cetakan atau template 'read-only' sistem (seperti file ISO instalan). Contoh: 'debian:12-slim'. Image tidak bisa diubah langsung, melainkan dijadikan bahan dasar pembuatan container." },
        { term: "Docker Container", desc: "Instansiasi hidup dari sebuah image. Container adalah mesin virtual mini tempat kita menginstal server, mengedit file konfigurasi, dan menjalankan service jaringan." },
        { term: "Port Mapping (-p)", desc: "Mekanisme menjembatani port laptop (Host) ke port di dalam Container. Contoh '-p 8080:80' artinya kita membuka browser di laptop 'localhost:8080' untuk mengakses Apache port 80 di dalam container." },
      ],
    },
    steps: [
      { title: "Pahami dulu istilah dasarnya", description: "Docker dipakai untuk menjalankan Debian kecil di dalam container. Siswa tidak perlu menginstal Debian manual seperti instal OS di VirtualBox. Docker akan mengunduh image Debian, lalu membuat container dari image itu.", commands: [{ label: "Analogi singkat", where: "Host", command: "Image     = template sistem, contoh: debian:12-slim\nContainer = Debian yang sedang berjalan dari image\nHost      = laptop siswa/guru\nPort      = pintu akses layanan, contoh 8080 -> 80", explanation: "Image → cetakan/template OS (seperti file ISO tapi lebih ringan)\nContainer → mesin virtual mini yang dibuat dari image, bisa dijalankan, dihentikan, dan dihapus\nHost → komputer fisik tempat Docker diinstal (laptop/PC siswa)\nPort → nomor pintu untuk mengakses layanan, misal port 80 untuk web server" }], note: "Kalau perintah docker run memakai debian:12-slim dan image belum ada, Docker otomatis download saat pertama kali dijalankan." },
      { title: "Pilihan instalasi yang disarankan", description: "Untuk kelas pemula, Docker Desktop paling mudah karena sudah membawa Docker Engine dan Docker CLI. Jika laptop berat, siswa tetap bisa memakai Docker CLI dari terminal, tetapi tetap membutuhkan engine.", commands: [{ label: "Pilih jalur", where: "PowerShell / Terminal", command: "Opsi A - Pemula Windows/macOS: Docker Desktop\nOpsi B - Windows lebih ringan: WSL 2 + Docker CLI/Engine\nOpsi C - Paling ringan: Linux native + Docker Engine\nOpsi D - macOS alternatif: Colima + Docker CLI", explanation: "Opsi A → paling mudah, cocok untuk pemula, sudah ada GUI dan engine\nOpsi B → lebih ringan di Windows, menggunakan subsistem Linux bawaan Windows\nOpsi C → paling ringan karena tidak perlu lapisan virtualisasi tambahan\nOpsi D → alternatif macOS tanpa Docker Desktop, lebih hemat resource" }], note: "Docker CLI bukan pengganti engine. CLI hanya alat mengetik perintah; engine tetap harus berjalan di Docker Desktop, WSL 2, Linux, atau Colima." },
      { title: "Instal di Windows 11 dengan Docker Desktop", description: "Aktifkan virtualisasi di BIOS/UEFI, aktifkan WSL 2, instal Docker Desktop, lalu pastikan status Docker Desktop sudah Engine running sebelum mengetik perintah lab.", commands: [{ label: "Cek WSL dan Docker", where: "PowerShell / Terminal", command: "wsl --status\ndocker --version\ndocker info\ndocker run --rm hello-world", explanation: "wsl --status → mengecek apakah WSL 2 sudah aktif dan versinya\ndocker --version → menampilkan versi Docker CLI yang terinstal\ndocker info → menampilkan info lengkap Docker Engine (status, driver, OS)\ndocker run --rm hello-world → menjalankan container tes, lalu otomatis dihapus (--rm)" }], note: "Jika docker info error, biasanya Docker Desktop belum dibuka, WSL belum aktif, atau virtualisasi BIOS belum menyala." },
      { title: "Instal di macOS guru", description: "Unduh Docker Desktop sesuai prosesor Mac, pasang ke Applications, buka aplikasinya, lalu tunggu hingga Docker Engine running.", commands: [{ label: "Verifikasi", where: "Host", command: "docker --version\ndocker info\ndocker run --rm hello-world", explanation: "docker --version → memastikan Docker sudah terinstal\ndocker info → mengecek Docker Engine aktif dan konfigurasinya\ndocker run --rm hello-world → tes menjalankan container pertama" }] },
      { title: "Opsi Docker CLI tanpa tampilan berat", description: "Jika Docker Desktop terasa lambat, gunakan terminal untuk semua praktik. Pada Windows, buka PowerShell atau terminal WSL. Pada Linux, cukup gunakan Docker Engine dan Docker CLI.", commands: [{ label: "Contoh Linux/WSL", where: "PowerShell / Terminal", command: "docker version\ndocker ps\ndocker images", explanation: "docker version → menampilkan versi client dan server Docker\ndocker ps → menampilkan daftar container yang sedang berjalan\ndocker images → menampilkan daftar image yang sudah diunduh" }, { label: "Contoh macOS dengan Colima", where: "Host", command: "brew install colima docker\ncolima start --cpu 2 --memory 3\ndocker info", explanation: "brew install colima docker → menginstal Colima dan Docker CLI via Homebrew\ncolima start --cpu 2 --memory 3 → menjalankan VM Linux ringan dengan 2 CPU dan 3GB RAM\ndocker info → memastikan Docker Engine sudah berjalan di atas Colima" }], note: "Untuk kelas besar, Docker Desktop lebih mudah didukung. Untuk laptop rendah spesifikasi, Linux native atau WSL 2 dengan resource kecil biasanya lebih responsif." },
      { title: "Batasi resource agar tidak lemot", description: "Di Docker Desktop > Settings > Resources, mulai dengan 2 CPU dan RAM 2-4 GB. Tutup aplikasi berat saat praktik agar laptop siswa tidak penuh RAM.", commands: [{ label: "Cek penggunaan", where: "PowerShell / Terminal", command: "docker system df\ndocker ps -a", explanation: "docker system df → menampilkan penggunaan disk oleh image, container, dan volume\ndocker ps -a → menampilkan SEMUA container (termasuk yang sudah dihentikan)" }], note: "Jangan menjalankan VirtualBox bersamaan dengan Docker Desktop saat praktik, karena keduanya memakai virtualisasi dan RAM besar." },
    ],
    test: [{ label: "Tes akhir persiapan", where: "PowerShell / Terminal", command: "docker --version\ndocker info\ndocker run --rm debian:12-slim cat /etc/debian_version", explanation: "docker --version → memastikan Docker terinstal\ndocker info → memastikan Engine aktif\ndocker run --rm debian:12-slim cat /etc/debian_version → menjalankan Debian, tampilkan versi, lalu hapus container" }],
  },
  {
    id: "debian",
    number: "01",
    title: "Debian Client",
    icon: "terminal",
    duration: "40 menit",
    level: "Dasar",
    summary: "Membuat jaringan lab dan Debian client yang dipakai untuk menguji semua server, tanpa instal Debian manual.",
    objectives: ["Mengunduh image Debian otomatis", "Membuat bridge network", "Menjalankan Debian 12 Slim", "Masuk ke shell container", "Memasang alat diagnosis jaringan"],
    theory: {
      title: "Apa itu Debian & Mengapa Menjadi Standar ASJ?",
      summary: "Debian adalah salah satu distribusi sistem operasi Linux tertua, paling stabil, dan paling banyak digunakan di dunia untuk server enterprise, hosting, dan kurikulum TKJ.",
      points: [
        { term: "Filosofi Debian (The Universal OS)", desc: "Debian dikenal dengan kestabilannya yang luar biasa dan komitmennya pada perangkat lunak bebas (FOSS). Banyak OS populer seperti Ubuntu, Linux Mint, dan Kali Linux merupakan turunan langsung dari Debian." },
        { term: "Debian Slim Image", desc: "Varian resmi Debian yang dipangkas ukuran memorinya dari ~1 GB menjadi ~80 MB. Sangat cocok untuk lab sekolah agar 1 laptop bisa menjalankan 8 server Debian sekaligus tanpa lag." },
        { term: "APT (Advanced Package Tool)", desc: "Manajer paket utama Debian (`apt update`, `apt install`). Berfungsi mengunduh dan memasang software server secara otomatis dari repositori resmi." },
        { term: "Debian Client di Lab ASJ", desc: "Bertindak sebagai komputer penguji / workstation teknisi di dalam jaringan lab untuk mengetes web (curl), DNS (dig), database (mariadb-client), dan ping ke server lain." },
      ],
    },
    steps: [
      { title: "Pastikan Docker siap", description: "Sebelum membuat Debian client, pastikan perintah docker bisa berjalan. Jika perintah ini gagal, jangan lanjut ke modul berikutnya dulu.", commands: [{ label: "Cek engine", where: "Host", command: "docker info\ndocker ps", explanation: "docker info → memastikan Docker Engine aktif dan siap dipakai\ndocker ps → menampilkan container yang sedang berjalan (harusnya kosong di awal)" }], note: "Di Windows, jalankan dari PowerShell atau terminal WSL. Di macOS, jalankan dari Terminal." },
      { title: "Download image Debian", description: "Kita tidak menginstal Debian seperti OS biasa. Perintah pull hanya mengambil template Debian kecil dari Docker Hub. Nanti container dibuat dari template ini.", commands: [{ label: "Ambil image", where: "Host", command: "docker pull debian:12-slim\ndocker images", explanation: "docker pull debian:12-slim → mengunduh image Debian 12 versi slim (ringan, ~80MB) dari Docker Hub\ndocker images → memastikan image sudah tersimpan di komputer" }], note: "Jika lupa menjalankan docker pull, tidak masalah. Docker run akan mengunduh image otomatis saat pertama kali dipakai." },
      { title: "Buat jaringan praktik", description: "Semua server lab akan berkomunikasi dalam subnet yang sama. Jaringan ini terisolasi dari LAN sekolah sehingga aman untuk latihan DNS, mail, dan simulasi DHCP.", commands: [{ label: "Buat network", where: "Host", command: "docker network create --driver bridge --subnet 172.25.0.0/24 lab-asj", explanation: "docker network create → membuat jaringan virtual baru di Docker\n--driver bridge → mode bridge = jaringan lokal terisolasi (tidak bocor ke LAN sekolah)\n--subnet 172.25.0.0/24 → menentukan rentang IP: 172.25.0.1 sampai 172.25.0.254\nlab-asj → nama jaringan yang akan dipakai semua container lab" }, { label: "Periksa", where: "Host", command: "docker network inspect lab-asj", explanation: "docker network inspect lab-asj → menampilkan detail jaringan: subnet, gateway, dan container yang terhubung" }] },
      { title: "Jalankan Debian client", description: "Container client-asj adalah Debian kecil yang terus menyala untuk menguji server lain. Batas RAM dan CPU menjaga komputer siswa tetap responsif.", commands: [{ label: "Buat container", where: "Host", command: "docker run -dit --name client-asj --hostname client-asj --network lab-asj --ip 172.25.0.10 --memory 384m --cpus 0.5 debian:12-slim sleep infinity", explanation: "docker run → membuat dan menjalankan container baru\n-dit → -d (background) + -i (interaktif) + -t (terminal)\n--name client-asj → memberi nama container agar mudah dikelola\n--hostname client-asj → nama host di dalam container\n--network lab-asj → menghubungkan ke jaringan lab yang sudah dibuat\n--ip 172.25.0.10 → memberikan IP tetap\n--memory 384m → membatasi RAM maksimal 384 MB\n--cpus 0.5 → membatasi penggunaan CPU 50%\ndebian:12-slim → image yang digunakan\nsleep infinity → perintah agar container tetap menyala tanpa batas waktu" }, { label: "Cek status", where: "Host", command: "docker ps\ndocker inspect client-asj --format '{{.State.Status}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'", explanation: "docker ps → melihat container yang sedang berjalan\ndocker inspect → menampilkan detail container, format dipakai untuk mengambil status dan IP saja" }] },
      { title: "Masuk ke Debian", description: "Perintah docker exec membuka shell bash di dalam container. Prompt terminal akan berubah karena sekarang siswa berada di Debian container, bukan langsung di laptop host.", commands: [{ label: "Masuk", where: "Host", command: "docker exec -it client-asj bash", explanation: "docker exec → menjalankan perintah di container yang sudah berjalan\n-it → membuka sesi interaktif dengan terminal\nclient-asj → nama container yang dituju\nbash → membuka shell Bash (command line Debian)" }, { label: "Cek identitas Debian", where: "Container", command: "cat /etc/os-release\nhostname\nip address", explanation: "cat /etc/os-release → menampilkan info OS (nama, versi Debian)\nhostname → menampilkan nama host container\nip address → menampilkan semua interface jaringan dan IP yang aktif" }] },
      { title: "Pasang alat pengujian", description: "Debian slim sengaja sangat kecil, jadi banyak alat jaringan belum tersedia. Pasang ping, curl, DNS tools, FTP client, telnet, netcat, dan MariaDB client.", commands: [{ label: "Di dalam Debian", where: "Container", command: "apt update\napt install -y iproute2 iputils-ping curl dnsutils netcat-openbsd telnet lftp mariadb-client\nip address\nexit", explanation: "apt update → memperbarui daftar paket dari repositori Debian\napt install -y → menginstal paket tanpa konfirmasi (-y = yes otomatis)\niproute2 → perintah ip address, ip route\niputils-ping → perintah ping\ncurl → mengakses URL dari terminal\ndnsutils → perintah dig, nslookup untuk tes DNS\nnetcat-openbsd → perintah nc untuk tes port\ntelnet → client telnet untuk demonstrasi\nlftp → client FTP untuk upload/download file\nmariadb-client → client database MariaDB\nexit → keluar dari container kembali ke host" }] },
      { title: "Latihan keluar, masuk, stop, dan start", description: "Siswa perlu tahu bahwa container bisa dihentikan dan dijalankan lagi tanpa membuat ulang dari awal.", commands: [{ label: "Kelola container", where: "Host", command: "docker stop client-asj\ndocker start client-asj\ndocker exec -it client-asj bash", explanation: "docker stop client-asj → menghentikan container (data tetap ada)\ndocker start client-asj → menjalankan kembali container yang sudah dihentikan\ndocker exec -it client-asj bash → masuk kembali ke shell Debian" }], note: "Gunakan exit untuk keluar dari shell container. Jangan memakai docker rm kecuali memang ingin menghapus container." },
    ],
    test: [{ label: "Status", where: "Host", command: "docker ps\ndocker inspect client-asj", explanation: "docker ps → memastikan container client-asj berjalan\ndocker inspect → melihat detail lengkap (IP, status, konfigurasi)" }, { label: "Tes dari dalam Debian", where: "Host", command: "docker exec client-asj cat /etc/debian_version\ndocker exec client-asj ping -c 2 172.25.0.10", explanation: "cat /etc/debian_version → memastikan versi Debian aktif\nping -c 2 172.25.0.10 → mengirim 2 paket ping ke IP sendiri untuk tes jaringan" }],
  },
  {
    id: "web",
    number: "02",
    title: "Web Server Apache",
    icon: "web",
    duration: "30 menit",
    level: "Dasar",
    summary: "Menginstal Apache pada Debian dan menerbitkan halaman melalui port 8080.",
    objectives: ["Memahami port mapping", "Menginstal Apache", "Menguji dari browser dan client"],
    theory: {
      title: "Apa itu Web Server & Apache HTTP Server?",
      summary: "Web Server adalah perangkat lunak yang bertugas menerima permintaan HTTP/HTTPS dari klien (seperti web browser) dan mengirimkan kembali berkas HTML, gambar, atau halaman web yang diminta.",
      points: [
        { term: "Protokol HTTP (Port 80) & HTTPS (Port 443)", desc: "HTTP (HyperText Transfer Protocol) adalah protokol komunikasi data web standar di port 80. HTTPS menambahkan enkripsi SSL/TLS di port 443 untuk keamanan transmisi data." },
        { term: "Apache HTTP Server (apache2)", desc: "Salah satu web server open-source paling populer di dunia. Menggunakan arsitektur modular, file konfigurasi di `/etc/apache2/`, dan perintah kontrol `apachectl`." },
        { term: "DocumentRoot (`/var/www/html`)", desc: "Direktori utama di sistem Linux tempat file website disimpan. File `index.html` di direktori ini akan otomatis disajikan saat domain atau IP diakses klien." },
        { term: "Virtual Host (VHost)", desc: "Fitur yang memungkinkan satu web server fisik/container melayani banyak website dan nama domain yang berbeda secara independen." },
      ],
    },
    steps: [
      { title: "Buat server", description: "Port 8080 pada host diteruskan ke port 80 milik container.", commands: [{ label: "Jalankan", where: "Host", command: "docker run -dit --name web-asj --hostname web.sekolah.test --network lab-asj --ip 172.25.0.80 -p 8080:80 --memory 384m debian:12-slim sleep infinity", explanation: "docker run -dit → membuat dan menjalankan container di background\n--name web-asj → nama container untuk web server\n--hostname web.sekolah.test → nama host yang muncul di dalam container\n--network lab-asj → menghubungkan ke jaringan lab\n--ip 172.25.0.80 → IP tetap untuk web server\n-p 8080:80 → port mapping: akses port 8080 di laptop diteruskan ke port 80 di container\n--memory 384m → batas RAM 384 MB\nsleep infinity → menjaga container tetap menyala" }] },
      { title: "Instal Apache", description: "Masuk ke container dan instal paket web server.", commands: [{ label: "Masuk dan instal", where: "Host", command: "docker exec -it web-asj bash", explanation: "docker exec -it web-asj bash → masuk ke shell container web-asj" }, { label: "Instal", where: "Container", command: "apt update\napt install -y apache2 curl nano", explanation: "apt update → memperbarui daftar paket\napt install -y apache2 → menginstal Apache web server\ncurl → untuk mengetes web dari dalam container\nnano → editor teks sederhana untuk mengedit file konfigurasi" }] },
      { title: "Buat halaman", description: "Ganti nama siswa sesuai identitas masing-masing.", commands: [{ label: "Konten", where: "Container", command: "echo '<h1>Web Server ASJ XI TKJ</h1><p>Nama: Siswa 01</p>' > /var/www/html/index.html\napachectl start\napachectl -S\nexit", explanation: "echo '...' > /var/www/html/index.html → menulis HTML ke file utama web server\n/var/www/html/ → direktori default tempat Apache mencari file website\napachectl start → menjalankan Apache web server\napachectl -S → menampilkan konfigurasi virtual host yang aktif\nexit → keluar dari container" }] },
    ],
    test: [{ label: "Dari host", where: "Host", command: "curl http://localhost:8080", explanation: "curl http://localhost:8080 → mengakses web server dari laptop melalui port 8080" }, { label: "Dari client", where: "Host", command: "docker exec client-asj curl http://172.25.0.80", explanation: "docker exec client-asj curl → menjalankan curl dari dalam container client\nhttp://172.25.0.80 → mengakses IP web server langsung di jaringan lab" }],
  },
  {
    id: "database",
    number: "03",
    title: "Database MariaDB",
    icon: "database",
    duration: "35 menit",
    level: "Menengah",
    summary: "Menjalankan MariaDB dengan volume persisten, database, tabel, dan user siswa.",
    objectives: ["Memahami volume", "Membuat tabel dan data", "Menguji koneksi remote"],
    theory: {
      title: "Apa itu Database Server & MariaDB?",
      summary: "Database Server adalah sistem penyimpanan data terstruktur yang memungkinkan aplikasi web menyimpan, mengubah, mencari, dan mengelola informasi secara aman dan cepat.",
      points: [
        { term: "RDBMS & SQL (Port 3306)", desc: "Relational Database Management System (RDBMS) menyusun data ke dalam baris dan kolom (tabel). SQL (Structured Query Language) adalah bahasa perintah standar untuk mengelola data (SELECT, INSERT, UPDATE, DELETE)." },
        { term: "MariaDB vs MySQL", desc: "MariaDB adalah fork open-source murni dari MySQL yang dikembangkan oleh pendiri asli MySQL setelah MySQL diakuisisi Oracle. MariaDB lebih cepat, gratis, dan menjadi standar bawaan di Debian Linux." },
        { term: "Volume Persisten Docker (-v)", desc: "Secara default, data container bersifat sementara (hilang jika container dihapus). Volume Docker memetakan folder data `/var/lib/mysql` ke storage host sehingga database tetap abadi walau container di-restart atau di-upgrade." },
        { term: "User Management & Hak Akses", desc: "Praktik keamanan database: jangan gunakan akun `root` untuk aplikasi web biasa. Buat user khusus (misal: `siswa`) dengan hak akses terbatas hanya ke database yang ditentukan." },
      ],
    },
    steps: [
      { title: "Buat volume", description: "Volume menjaga data tetap ada saat container dihapus dan dibuat ulang.", commands: [{ label: "Volume", where: "Host", command: "docker volume create data-db-asj", explanation: "docker volume create data-db-asj → membuat volume bernama data-db-asj\nVolume = penyimpanan data yang terpisah dari container\nJika container dihapus, data di volume tetap aman" }] },
      { title: "Jalankan MariaDB", description: "Gunakan password ini hanya untuk jaringan lab.", commands: [{ label: "Server database", where: "Host", command: "docker run -d --name db-asj --hostname db.sekolah.test --network lab-asj --ip 172.25.0.100 -p 3307:3306 --memory 512m -e MARIADB_ROOT_PASSWORD=RootASJ2026! -e MARIADB_DATABASE=sekolah -e MARIADB_USER=siswa -e MARIADB_PASSWORD=SiswaASJ2026! -v data-db-asj:/var/lib/mysql mariadb:11", explanation: "docker run -d → menjalankan container di background\n--name db-asj → nama container database\n--ip 172.25.0.100 → IP tetap untuk database server\n-p 3307:3306 → port 3307 host diteruskan ke port 3306 (port default MySQL/MariaDB)\n--memory 512m → batas RAM 512 MB\n-e MARIADB_ROOT_PASSWORD=... → mengatur password root database\n-e MARIADB_DATABASE=sekolah → otomatis membuat database bernama 'sekolah'\n-e MARIADB_USER=siswa → membuat user 'siswa' untuk akses database\n-e MARIADB_PASSWORD=... → password untuk user siswa\n-v data-db-asj:/var/lib/mysql → menghubungkan volume ke direktori data MariaDB\nmariadb:11 → image MariaDB versi 11 dari Docker Hub" }, { label: "Pantau log", where: "Host", command: "docker logs -f db-asj", explanation: "docker logs -f db-asj → menampilkan log container secara realtime (-f = follow)\nTunggu sampai muncul 'ready for connections' yang berarti database siap dipakai\nTekan Ctrl+C untuk berhenti memantau log" }] },
      { title: "Buat tabel", description: "Tekan Ctrl+C setelah ready for connections, lalu masuk sebagai root.", commands: [{ label: "Masuk MariaDB", where: "Host", command: "docker exec -it db-asj mariadb -u root -p", explanation: "docker exec -it db-asj → masuk ke container database\nmariadb → menjalankan client MariaDB\n-u root → login sebagai user root\n-p → meminta password (ketik RootASJ2026!)" }, { label: "SQL", where: "Container", command: "USE sekolah;\nCREATE TABLE siswa (id INT AUTO_INCREMENT PRIMARY KEY, nama VARCHAR(100), kelas VARCHAR(20));\nINSERT INTO siswa (nama, kelas) VALUES ('Budi', 'XI TKJ 1');\nSELECT * FROM siswa;\nEXIT;", explanation: "USE sekolah → memilih database 'sekolah' untuk digunakan\nCREATE TABLE siswa → membuat tabel bernama 'siswa' dengan kolom:\n  - id: nomor otomatis (PRIMARY KEY)\n  - nama: teks maksimal 100 karakter\n  - kelas: teks maksimal 20 karakter\nINSERT INTO → memasukkan data baru ke tabel\nSELECT * FROM siswa → menampilkan semua data di tabel siswa\nEXIT → keluar dari MariaDB client" }] },
    ],
    test: [{ label: "Koneksi client", where: "Host", command: "docker exec -it client-asj mariadb -h 172.25.0.100 -u siswa -p sekolah", explanation: "Menguji koneksi dari container client ke database server\n-h 172.25.0.100 → alamat IP database server\n-u siswa → login dengan user siswa\n-p → meminta password (ketik SiswaASJ2026!)\nsekolah → langsung masuk ke database 'sekolah'" }],
  },
  {
    id: "ftp",
    number: "04",
    title: "FTP Server vsftpd",
    icon: "folder",
    duration: "35 menit",
    level: "Menengah",
    summary: "Membuat akun FTP dan menguji upload file pada jaringan container.",
    objectives: ["Menginstal vsftpd", "Membuat user FTP", "Melakukan upload dengan lftp"],
    theory: {
      title: "Apa itu FTP Server & vsftpd?",
      summary: "FTP (File Transfer Protocol) adalah protokol jaringan tertua yang dirancang khusus untuk memindahkan, mengunggah (upload), dan mengunduh (download) file antara komputer klien dan server.",
      points: [
        { term: "Port Kontrol (21) & Port Data", desc: "FTP bekerja menggunakan dua saluran koneksi: Port 21 untuk mengirim perintah teks (login, navigasi direktori) dan port terpisah untuk aliran transfer data aktual." },
        { term: "Mode Aktif vs Mode Pasif (PASV)", desc: "Dalam mode pasif (PASV), klien meminta server membuka port data acak (misal: 30000-30009). Mode ini sangat penting di era modern karena ramah firewall, NAT router, dan port mapping Docker." },
        { term: "vsftpd (Very Secure FTP Daemon)", desc: "Software FTP server paling terpercaya di Linux yang dirancang dengan prinsip keamanan tinggi, performa kilat, dan proteksi dari serangan buffer overflow." },
        { term: "Chroot Jail", desc: "Mekanisme pengurungan direktori: pengguna FTP dikunci di dalam folder home miliknya sendiri (misal: `/home/ftpuser/`) sehingga tidak bisa melihat atau merusak file sistem `/etc` atau `/var`." },
      ],
    },
    steps: [
      { title: "Buat FTP server", description: "Port pasif disediakan untuk latihan koneksi FTP.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name ftp-asj --hostname ftp.sekolah.test --network lab-asj --ip 172.25.0.21 -p 2121:21 -p 30000-30009:30000-30009 --memory 384m debian:12-slim sleep infinity", explanation: "docker run -dit → membuat container FTP di background\n--name ftp-asj → nama container\n--ip 172.25.0.21 → IP tetap FTP server\n-p 2121:21 → port 2121 host ke port 21 (port FTP command)\n-p 30000-30009:30000-30009 → rentang port pasif untuk transfer data FTP\n--memory 384m → batas RAM 384 MB" }] },
      { title: "Instal dan buat akun", description: "Akun ftpuser akan dibatasi di direktori home miliknya.", commands: [{ label: "Masuk", where: "Host", command: "docker exec -it ftp-asj bash", explanation: "Masuk ke shell container FTP server" }, { label: "Instal", where: "Container", command: "apt update\napt install -y vsftpd nano\nuseradd -m -s /bin/bash ftpuser\necho 'ftpuser:BelajarFTP2026!' | chpasswd\nmkdir -p /home/ftpuser/ftp/upload\nchown -R ftpuser:ftpuser /home/ftpuser/ftp", explanation: "apt install -y vsftpd → menginstal Very Secure FTP Daemon\nnano → editor teks untuk mengedit konfigurasi\nuseradd -m -s /bin/bash ftpuser → membuat user baru bernama ftpuser dengan home directory\necho '...' | chpasswd → mengatur password user\nmkdir -p → membuat direktori upload (dan parent-nya jika belum ada)\nchown -R → mengubah kepemilikan folder ke ftpuser agar bisa baca/tulis" }] },
      { title: "Konfigurasi dan mulai", description: "Mode pasif membantu koneksi melalui port mapping.", commands: [{ label: "Konfigurasi", where: "Container", command: "printf '%s\\n' 'listen=YES' 'listen_ipv6=NO' 'anonymous_enable=NO' 'local_enable=YES' 'write_enable=YES' 'local_umask=022' 'chroot_local_user=YES' 'allow_writeable_chroot=YES' 'pasv_enable=YES' 'pasv_min_port=30000' 'pasv_max_port=30009' > /etc/vsftpd.conf\nvsftpd /etc/vsftpd.conf &\nexit", explanation: "printf → menulis konfigurasi vsftpd ke file /etc/vsftpd.conf\nlisten=YES → vsftpd mendengarkan koneksi di IPv4\nanonymous_enable=NO → tidak mengizinkan login tanpa akun\nlocal_enable=YES → mengizinkan login dengan user lokal\nwrite_enable=YES → mengizinkan upload file\nchroot_local_user=YES → mengunci user di home directory-nya (tidak bisa naik ke /)\npasv_enable=YES → mengaktifkan mode pasif\npasv_min/max_port → rentang port untuk transfer data pasif\nvsftpd ... & → menjalankan server FTP di background\nexit → keluar dari container" }] },
    ],
    test: [{ label: "Upload dari client", where: "Host", command: "docker exec -it client-asj lftp -u ftpuser,BelajarFTP2026! ftp://172.25.0.21", explanation: "lftp → client FTP canggih dari terminal\n-u ftpuser,BelajarFTP2026! → login dengan username dan password\nftp://172.25.0.21 → alamat FTP server di jaringan lab\nDi dalam lftp bisa mengetik: ls, put, get, bye" }],
  },
  {
    id: "dns",
    number: "05",
    title: "DNS Server BIND9",
    icon: "dns",
    duration: "45 menit",
    level: "Menengah",
    summary: "Membuat zona sekolah.test beserta record web, FTP, mail, database, dan MX.",
    objectives: ["Memahami zona DNS", "Membuat record A dan MX", "Menguji dengan dig"],
    theory: {
      title: "Apa itu DNS Server & BIND9?",
      summary: "DNS (Domain Name System) adalah buku telepon internet yang bertugas menerjemahkan nama domain manusia (seperti 'web.sekolah.test') menjadi alamat IP angka (seperti '172.25.0.80') yang dipahami oleh komputer jaringan.",
      points: [
        { term: "Port DNS (53 UDP/TCP)", desc: "Kueri pencarian nama domain umum menggunakan UDP port 53 untuk kecepatan tinggi. Transfer zona antar server DNS menggunakan TCP port 53 untuk keandalan data." },
        { term: "BIND9 (Berkeley Internet Name Domain)", desc: "Software DNS server paling banyak digunakan di internet. Konfigurasi zona utamanya berada di `/etc/bind/named.conf.local` dan file database zona." },
        { term: "Record A & Record AAAA", desc: "Record A (Address) memetakan nama domain ke alamat IPv4 (contoh: `web IN A 172.25.0.80`). Record AAAA memetakan domain ke alamat IPv6." },
        { term: "Record MX (Mail Exchange)", desc: "Menentukan server email mana yang bertanggung jawab menerima pesan untuk domain tersebut (contoh: `@ IN MX 10 mail.sekolah.test`)." },
        { term: "SOA (Start of Authority) & Serial Number", desc: "Informasi otoritas zona DNS yang memuat serial number versi (format `YYYYMMDDNN`). Serial wajib dinaikkan setiap kali record diubah agar DNS resolver memperbarui cache." },
      ],
    },
    steps: [
      { title: "Buat dan instal DNS", description: "Port 1053 host dipakai agar tidak berbenturan dengan DNS sistem.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name dns-asj --hostname ns1.sekolah.test --network lab-asj --ip 172.25.0.53 -p 1053:53/udp -p 1053:53/tcp --memory 384m debian:12-slim sleep infinity\ndocker exec -it dns-asj bash", explanation: "docker run → membuat container DNS server\n--name dns-asj → nama container\n--ip 172.25.0.53 → IP 172.25.0.53 (angka 53 = port DNS, agar mudah diingat)\n-p 1053:53/udp → port 1053 host ke port 53 container (UDP, protokol utama DNS)\n-p 1053:53/tcp → sama tapi untuk TCP (dipakai untuk transfer zona)\ndocker exec → masuk ke container DNS" }, { label: "Instal", where: "Container", command: "apt update\napt install -y bind9 bind9-utils dnsutils nano", explanation: "bind9 → software DNS server paling populer (BIND = Berkeley Internet Name Domain)\nbind9-utils → perintah rndc untuk mengelola BIND\ndnsutils → perintah dig dan nslookup untuk mengetes DNS\nnano → editor teks" }] },
      { title: "Daftarkan zona", description: "Tambahkan zona master sekolah.test.", commands: [{ label: "named.conf.local", where: "Container", command: "cat >> /etc/bind/named.conf.local <<'EOF'\nzone \"sekolah.test\" {\n  type master;\n  file \"/etc/bind/db.sekolah.test\";\n};\nEOF", explanation: "cat >> → menambahkan teks ke akhir file (tanpa menghapus isi yang sudah ada)\nnamed.conf.local → file konfigurasi zona lokal BIND\nzone \"sekolah.test\" → mendaftarkan zona baru bernama sekolah.test\ntype master → server ini adalah sumber utama (bukan secondary/slave)\nfile → lokasi file zona yang berisi record DNS" }] },
      { title: "Buat record", description: "Serial harus dinaikkan setiap kali file zona diubah.", commands: [{ label: "File zona", where: "Container", command: "cat > /etc/bind/db.sekolah.test <<'EOF'\n$TTL 86400\n@ IN SOA ns1.sekolah.test. admin.sekolah.test. (\n  2026090101 3600 1800 604800 86400 )\n@    IN NS ns1.sekolah.test.\nns1  IN A  172.25.0.53\nweb  IN A  172.25.0.80\nftp  IN A  172.25.0.21\nmail IN A  172.25.0.25\ndb   IN A  172.25.0.100\n@    IN MX 10 mail.sekolah.test.\nEOF\nnamed-checkconf\nnamed-checkzone sekolah.test /etc/bind/db.sekolah.test\nnamed -g -c /etc/bind/named.conf &\nexit", explanation: "$TTL 86400 → Time To Live: cache DNS berlaku 86400 detik (24 jam)\nSOA → Start of Authority: informasi otoritas zona\n  ns1.sekolah.test. → nama server DNS utama (titik di akhir = FQDN)\n  admin.sekolah.test. → email admin (@ diganti titik)\n  2026090101 → serial number (tanggal + versi, naikkan tiap edit)\nNS → Name Server: server yang bertanggung jawab atas zona ini\nA → Address record: memetakan nama ke IPv4\n  web IN A 172.25.0.80 → web.sekolah.test = 172.25.0.80\n  ftp IN A 172.25.0.21 → ftp.sekolah.test = 172.25.0.21\nMX → Mail Exchange: mengarahkan email ke mail.sekolah.test\n  10 → prioritas (makin kecil makin utama)\nnamed-checkconf → mengecek sintaks konfigurasi BIND\nnamed-checkzone → memvalidasi file zona\nnamed -g → menjalankan BIND di foreground untuk melihat log" }] },
    ],
    test: [{ label: "Record A dan MX", where: "Host", command: "docker exec client-asj dig @172.25.0.53 web.sekolah.test +short\ndocker exec client-asj dig @172.25.0.53 sekolah.test MX +short", explanation: "dig @172.25.0.53 → bertanya ke DNS server di IP 172.25.0.53\nweb.sekolah.test → nama domain yang ditanyakan\n+short → hanya menampilkan jawaban singkat (IP saja)\nMX → menanyakan record Mail Exchange" }],
  },
  {
    id: "mail",
    number: "06",
    title: "Mail Server Lokal",
    icon: "mail",
    duration: "50 menit",
    level: "Menengah",
    summary: "Mengirim email lokal sekolah.test dengan Postfix dan membaca mailbox pengguna.",
    objectives: ["Menginstal Postfix dan Dovecot", "Membuat pengguna mail", "Menguji SMTP dan IMAP"],
    warning: "Lab lokal saja. Jangan membuka SMTP ke Internet atau mencoba mengirim ke Gmail/Yahoo.",
    theory: {
      title: "Apa itu Mail Server, Postfix, & Dovecot?",
      summary: "Mail Server adalah sistem yang mengelola pengiriman, perutean, penerimaan, dan penyimpanan surat elektronik (email) di dalam jaringan lokal maupun internet.",
      points: [
        { term: "SMTP (Simple Mail Transfer Protocol - Port 25)", desc: "Protokol standar untuk MENGIRIM email antar server atau dari aplikasi klien ke server email (MTA - Mail Transfer Agent)." },
        { term: "IMAP (Port 143) & POP3 (Port 110)", desc: "Protokol untuk MEMBACA email dari mailbox server (MDA - Mail Delivery Agent). IMAP menyinkronkan status email secara live, sedangkan POP3 mengunduh email ke perangkat lokal." },
        { term: "Postfix (MTA)", desc: "Software server SMTP modern yang cepat, aman, dan mudah dikonfigurasi melalui utilitas `postconf`." },
        { term: "Dovecot (MDA/IMAP)", desc: "Software server IMAP/POP3 yang bertugas mengautentikasi pengguna dan menyajikan kotak surat pengguna." },
        { term: "Maildir vs Mbox", desc: "Format penyimpanan email. Maildir menyimpan setiap email sebagai satu file individual di folder `cur`, `new`, `tmp`, jauh lebih aman dari kerusakan file dibanding format mbox lama." },
      ],
    },
    steps: [
      { title: "Buat mail server", description: "SMTP host memakai 2525 dan IMAP memakai 1143.", commands: [{ label: "Container", where: "Host", command: "docker run -dit --name mail-asj --hostname mail.sekolah.test --network lab-asj --ip 172.25.0.25 -p 2525:25 -p 1143:143 --memory 512m debian:12-slim sleep infinity\ndocker exec -it mail-asj bash", explanation: "docker run → membuat container mail server\n--ip 172.25.0.25 → IP tetap mail server\n-p 2525:25 → port 2525 host ke port 25 (SMTP = mengirim email)\n-p 1143:143 → port 1143 host ke port 143 (IMAP = membaca email)\n--memory 512m → batas RAM 512 MB (mail server butuh lebih banyak)" }] },
      { title: "Instal layanan", description: "Konfigurasi awal Postfix dibuat noninteraktif.", commands: [{ label: "Instal", where: "Container", command: "export DEBIAN_FRONTEND=noninteractive\necho 'postfix postfix/mailname string sekolah.test' | debconf-set-selections\necho 'postfix postfix/main_mailer_type string Internet Site' | debconf-set-selections\napt update\napt install -y postfix dovecot-imapd mailutils nano", explanation: "export DEBIAN_FRONTEND=noninteractive → agar instalasi tidak menampilkan dialog interaktif\ndebconf-set-selections → menjawab pertanyaan instalasi Postfix secara otomatis:\n  mailname = sekolah.test (nama domain email)\n  mailer_type = Internet Site (mengirim/menerima email langsung)\npostfix → software SMTP server untuk mengirim email\ndovecot-imapd → software IMAP server untuk membaca email\nmailutils → perintah mail untuk mengirim email dari terminal\nnano → editor teks" }] },
      { title: "Atur Postfix", description: "Jaringan 172.25.0.0/24 diizinkan mengirim email lokal.", commands: [{ label: "postconf", where: "Container", command: "postconf -e 'myhostname = mail.sekolah.test'\npostconf -e 'mydomain = sekolah.test'\npostconf -e 'myorigin = $mydomain'\npostconf -e 'inet_interfaces = all'\npostconf -e 'mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain'\npostconf -e 'home_mailbox = Maildir/'\npostconf -e 'mynetworks = 127.0.0.0/8 172.25.0.0/24'", explanation: "postconf -e → mengedit konfigurasi Postfix via command line\nmyhostname → nama lengkap server email\nmydomain → domain email (sekolah.test)\nmyorigin → domain pengirim email (email@sekolah.test)\ninet_interfaces = all → mendengarkan di semua interface jaringan\nmydestination → domain yang diterima sebagai tujuan lokal\nhome_mailbox = Maildir/ → format penyimpanan email di folder user\nmynetworks → jaringan yang boleh mengirim email melalui server ini" }] },
      { title: "Buat user dan mulai", description: "Dua akun dipakai untuk simulasi pengirim dan penerima.", commands: [{ label: "User dan service", where: "Container", command: "useradd -m -s /bin/bash budi\necho 'budi:BelajarMail2026!' | chpasswd\nuseradd -m -s /bin/bash ani\necho 'ani:BelajarMail2026!' | chpasswd\nmkdir -p /home/budi/Maildir/{cur,new,tmp} /home/ani/Maildir/{cur,new,tmp}\nchown -R budi:budi /home/budi/Maildir\nchown -R ani:ani /home/ani/Maildir\npostfix start\ndovecot\nexit", explanation: "useradd -m → membuat user baru dengan home directory\necho '...' | chpasswd → mengatur password user\nmkdir -p /home/.../Maildir/{cur,new,tmp} → membuat struktur folder Maildir:\n  cur = email yang sudah dibaca\n  new = email baru yang belum dibaca\n  tmp = email sementara saat proses pengiriman\nchown -R → mengubah kepemilikan folder ke user masing-masing\npostfix start → menjalankan server SMTP\ndovecot → menjalankan server IMAP\nexit → keluar dari container" }] },
    ],
    test: [{ label: "Kirim lokal", where: "Host", command: "docker exec mail-asj bash -c \"echo 'Halo Ani dari praktik ASJ' | mail -s 'Tes Mail Server' ani@sekolah.test\"", explanation: "echo '...' | mail → mengirim email dari terminal\n-s 'Tes Mail Server' → subject/judul email\nani@sekolah.test → alamat penerima\nPerintah ini dijalankan di dalam container mail-asj" }, { label: "Cek port", where: "Host", command: "docker exec client-asj nc -vz 172.25.0.25 25\ndocker exec client-asj nc -vz 172.25.0.25 143", explanation: "nc -vz → netcat: mengecek apakah port terbuka (-v = verbose, -z = scan saja)\nport 25 → SMTP (kirim email)\nport 143 → IMAP (baca email)\nJika muncul 'succeeded' berarti port terbuka dan layanan aktif" }],
  },
  {
    id: "dhcp",
    number: "07",
    title: "DHCP — Simulasi Aman",
    icon: "dhcp",
    duration: "30 menit",
    level: "Penting",
    summary: "Mempelajari konfigurasi DHCP tanpa mengganggu jaringan sekolah.",
    objectives: ["Menginstal ISC DHCP Server", "Menentukan range, gateway, dan DNS", "Memvalidasi konfigurasi"],
    warning: "Jangan mengaktifkan DHCP praktik pada LAN sekolah. Dua DHCP server dapat mengacaukan gateway dan DNS seluruh kelas.",
    theory: {
      title: "Apa itu DHCP Server & Proses DORA?",
      summary: "DHCP (Dynamic Host Configuration Protocol - Port 67/68 UDP) adalah protokol yang secara otomatis memberikan alamat IP, subnet mask, default gateway, dan server DNS kepada komputer klien saat tersambung ke jaringan.",
      points: [
        { term: "Proses DORA (Discover, Offer, Request, Acknowledge)", desc: "1. Discover: Klien mencari DHCP server via broadcast.\n2. Offer: Server menawarkan IP.\n3. Request: Klien meminta IP yang ditawarkan.\n4. Acknowledge (ACK): Server mengonfirmasi dan mencatat sewa IP (lease)." },
        { term: "IP Range / Pool & Lease Time", desc: "Rentang alamat IP yang boleh dibagikan ke klien (misal: 172.25.0.150 - 180) dan durasi sewa waktu penggunaan IP sebelum harus diperbarui." },
        { term: "ISC DHCP Server (dhcpd)", desc: "Software server DHCP standar industri Linux dengan file konfigurasi utama di `/etc/dhcp/dhcpd.conf`." },
        { term: "Bahaya Rogue DHCP Server", desc: "Jika server DHCP dijalankan sembarangan di LAN sekolah fisik, server ini dapat 'berebut' memberikan IP salah ke laptop guru/siswa lain dan memutus akses internet seluruh gedung. Karena itu, lab ini dijalankan di subnet terisolasi `lab-asj`." },
      ],
    },
    steps: [
      { title: "Buat container", description: "Container tetap berada pada jaringan lab terisolasi.", commands: [{ label: "Container DHCP", where: "Host", command: "docker run -dit --name dhcp-asj --hostname dhcp.sekolah.test --network lab-asj --memory 256m --cap-add NET_ADMIN debian:12-slim sleep infinity\ndocker exec -it dhcp-asj bash", explanation: "docker run → membuat container DHCP\n--name dhcp-asj → nama container\n--network lab-asj → terhubung ke jaringan lab terisolasi\n--memory 256m → batas RAM 256 MB (DHCP ringan)\n--cap-add NET_ADMIN → menambahkan kemampuan administrasi jaringan (dibutuhkan DHCP untuk mengelola IP)\ndocker exec → masuk ke container" }] },
      { title: "Instal dan konfigurasi", description: "Range contoh berada di 172.25.0.150–180.", commands: [{ label: "Instal", where: "Container", command: "apt update\napt install -y isc-dhcp-server iproute2 nano", explanation: "isc-dhcp-server → software DHCP Server dari ISC (Internet Systems Consortium)\niproute2 → perintah ip untuk melihat konfigurasi jaringan\nnano → editor teks" }, { label: "dhcpd.conf", where: "Container", command: "cat > /etc/dhcp/dhcpd.conf <<'EOF'\nauthoritative;\ndefault-lease-time 600;\nmax-lease-time 7200;\noption domain-name \"sekolah.test\";\noption domain-name-servers 172.25.0.53;\nsubnet 172.25.0.0 netmask 255.255.255.0 {\n  range 172.25.0.150 172.25.0.180;\n  option routers 172.25.0.1;\n  option broadcast-address 172.25.0.255;\n}\nEOF", explanation: "authoritative → server ini berhak memberikan IP di jaringannya\ndefault-lease-time 600 → durasi sewa IP default = 600 detik (10 menit)\nmax-lease-time 7200 → sewa IP maksimal = 7200 detik (2 jam)\noption domain-name → nama domain yang diberikan ke client\noption domain-name-servers → alamat DNS server yang diberikan ke client\nsubnet ... netmask ... → mendefinisikan jaringan yang dikelola DHCP:\n  range 172.25.0.150 - 180 → rentang IP yang akan dibagikan ke client\n  option routers → gateway yang diberikan ke client\n  option broadcast-address → alamat broadcast jaringan" }] },
      { title: "Validasi", description: "Exit code 0 menandakan sintaks valid. Docker Desktop tidak meneruskan broadcast DHCP ke LAN fisik.", commands: [{ label: "Periksa sintaks", where: "Container", command: "dhcpd -t -cf /etc/dhcp/dhcpd.conf\necho $?\nexit", explanation: "dhcpd -t → mode tes: hanya mengecek sintaks, tidak menjalankan server\n-cf /etc/dhcp/dhcpd.conf → menunjuk file konfigurasi yang akan dicek\necho $? → menampilkan exit code perintah sebelumnya (0 = sukses, selainnya = error)\nexit → keluar dari container" }], note: "Uji lease nyata dilakukan guru pada Linux native dengan switch terisolasi." },
    ],
    test: [{ label: "Validasi ulang", where: "Host", command: "docker exec dhcp-asj dhcpd -t -cf /etc/dhcp/dhcpd.conf", explanation: "Menjalankan validasi konfigurasi DHCP dari luar container\nJika output tidak menunjukkan error, konfigurasi valid" }],
  },
  {
    id: "pengelolaan",
    number: "08",
    title: "Pengelolaan & Reset",
    icon: "shield",
    duration: "15 menit",
    level: "Penting",
    summary: "Menghentikan, melanjutkan, mendiagnosis, dan mereset lab dengan aman.",
    objectives: ["Menjaga pekerjaan siswa", "Mendiagnosis error", "Melakukan reset terkontrol"],
    warning: "Jangan menjalankan docker system prune -a --volumes pada komputer siswa tanpa pemeriksaan dan backup.",
    theory: {
      title: "Manajemen Siklus Hidup Container & Troubleshooting",
      summary: "Memahami perbedaan antara menghentikan (stop), menjalankan kembali (start), membaca log error, dan menghapus (rm) container lab secara aman tanpa kehilangan data penting.",
      points: [
        { term: "Docker Stop vs Docker Kill", desc: "`docker stop` mengirim sinyal SIGTERM memberikan waktu bagi service menyimpan data sebelum mati. `docker kill` memaksa mati seketika (SIGKILL)." },
        { term: "Docker Logs (Diagnosis)", desc: "Alat utama teknisi server untuk melihat penyebab kegagalan (`docker logs <container>`). Memberi informasi port bentrok, file config salah ketik, atau service crash." },
        { term: "Pemisahan Lifecycle Container & Data", desc: "Data tabel yang disimpan di Docker Volume (`data-db-asj`) tidak akan hilang saat container dihapus (`docker rm`), sehingga sistem dapat dibangun ulang kapan saja dengan aman." },
      ],
    },
    steps: [
      { title: "Hentikan tanpa menghapus", description: "Gunakan stop saat jam praktik selesai.", commands: [{ label: "Stop", where: "Host", command: "docker stop client-asj web-asj db-asj ftp-asj dns-asj mail-asj dhcp-asj", explanation: "docker stop → menghentikan container dengan aman (SIGTERM)\nSemua container lab dihentikan sekaligus\nData dan konfigurasi di dalam container tetap tersimpan" }, { label: "Lanjutkan", where: "Host", command: "docker start client-asj web-asj db-asj ftp-asj dns-asj mail-asj dhcp-asj", explanation: "docker start → menjalankan kembali container yang sudah dihentikan\nSemua layanan kembali aktif dengan konfigurasi sebelumnya\nPerlu menjalankan ulang service di dalam container (Apache, BIND, dll)" }] },
      { title: "Diagnosis", description: "Periksa status, log, ukuran, dan jaringan sebelum menghapus apa pun.", commands: [{ label: "Diagnosis aman", where: "Host", command: "docker ps -a\ndocker system df\ndocker logs NAMA_CONTAINER\ndocker network inspect lab-asj", explanation: "docker ps -a → melihat semua container (termasuk yang berhenti)\ndocker system df → melihat penggunaan disk (image, container, volume)\ndocker logs NAMA_CONTAINER → membaca log error/info container (ganti NAMA_CONTAINER)\ndocker network inspect lab-asj → melihat detail jaringan dan container yang terhubung" }] },
      { title: "Reset setelah penilaian", description: "Perintah berikut menghapus container lab; volume database dihapus terpisah.", commands: [{ label: "Hapus container", where: "Host", command: "docker rm -f client-asj web-asj db-asj ftp-asj dns-asj mail-asj dhcp-asj\ndocker network rm lab-asj", explanation: "docker rm -f → menghapus paksa container (termasuk yang sedang berjalan)\nSemua container lab dihapus sekaligus\ndocker network rm lab-asj → menghapus jaringan lab\nSetelah ini, lab bisa dibuat ulang dari modul 01" }, { label: "Opsional: hapus data DB", where: "Host", command: "docker volume rm data-db-asj", explanation: "docker volume rm data-db-asj → menghapus volume database\nPerhatian: SEMUA data tabel dan database akan hilang permanen\nHanya lakukan jika memang ingin reset total" }] },
    ],
  },
];

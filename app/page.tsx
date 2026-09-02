"use client";

import { useEffect, useMemo, useState } from "react";
import { modules, type CommandBlock, type Module } from "./data";

type Quiz = { question: string; options: string[]; answer: number; explanation: string };

const quizzes: Record<string, Quiz> = {
  persiapan: { question: "Apa tanda Docker siap dipakai?", options: ["Browser terbuka", "Docker Engine running", "Wi-Fi dimatkan"], answer: 1, explanation: "Docker Engine harus aktif sebelum container dapat dijalankan." },
  debian: { question: "Mengapa semua container memakai jaringan lab-asj?", options: ["Agar saling terhubung secara terisolasi", "Agar RAM bertambah", "Agar Docker tidak perlu diinstal"], answer: 0, explanation: "Bridge network membuat perangkat lab saling berkomunikasi tanpa mencampuri LAN sekolah." },
  web: { question: "Arti pemetaan port 8080:80 adalah…", options: ["Port 80 host menuju 8080 container", "Port 8080 host menuju 80 container", "Kedua port dinonaktifkan"], answer: 1, explanation: "Akses ke port 8080 host diteruskan ke Apache pada port 80 di container." },
  database: { question: "Fungsi volume data-db-asj adalah…", options: ["Menyimpan data agar tetap ada", "Mengganti password otomatis", "Mempercepat internet"], answer: 0, explanation: "Volume membuat data database tetap tersimpan walau container dibuat ulang." },
  ftp: { question: "Mengapa FTP lab ini tidak cocok untuk data rahasia?", options: ["FTP terlalu cepat", "FTP dasar tidak mengenkripsi trafik", "FTP hanya bekerja di macOS"], answer: 1, explanation: "FTP dasar mengirim autentikasi dan data tanpa enkripsi; gunakan hanya di jaringan lab." },
  dns: { question: "Record DNS untuk server web menggunakan tipe…", options: ["MX", "A", "TXT"], answer: 1, explanation: "Record A memetakan nama host ke alamat IPv4." },
  mail: { question: "Port yang dilatih untuk SMTP di dalam container adalah…", options: ["25", "53", "3306"], answer: 0, explanation: "SMTP memakai port 25 di container, lalu dipetakan ke 2525 pada host." },
  dhcp: { question: "Di mana DHCP praktik boleh diuji?", options: ["LAN sekolah aktif", "Jaringan lab terisolasi", "Wi-Fi publik"], answer: 1, explanation: "DHCP liar dapat mengubah gateway dan DNS pengguna lain, jadi wajib terisolasi." },
  pengelolaan: { question: "Langkah pertama saat container bermasalah adalah…", options: ["Hapus semua volume", "Periksa status dan log", "Instal ulang komputer"], answer: 1, explanation: "Diagnosis status, log, resource, dan jaringan harus dilakukan sebelum menghapus apa pun." },
};

function readStored<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const iconPaths: Record<string, React.ReactNode> = {
  setup: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.55V20.3h-3v-.09a1.7 1.7 0 0 0-1.04-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.55-1.04H5.3v-3h.15A1.7 1.7 0 0 0 7 9.92a1.7 1.7 0 0 0-.34-1.88L6.6 7.98l2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.7V4.6h3v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.04h.15v3h-.15A1.7 1.7 0 0 0 19.4 15Z"/></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/></>,
  web: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.47 3.6 5.47 3.6 9S14.4 18.53 12 21c-2.4-2.47-3.6-5.47-3.6-9S9.6 5.47 12 3Z"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></>,
  folder: <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z"/>,
  dns: <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="m8.2 7.2 7.4-.4M7.4 8.1l3.5 7.6M16.7 9l-3.4 6.7"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  dhcp: <><rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="15" width="16" height="5" rx="1"/><path d="M8 9v2.5h8V15M8 6.5h.01M8 17.5h.01"/></>,
  shield: <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Zm-3.5-10 2.2 2.2 4.8-5"/>,
};

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function CopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <button className={`copy-button ${copied ? "copied" : ""}`} onClick={copy} aria-label="Salin perintah">{copied ? "Tersalin" : "Salin"}</button>;
}

function Command({ block }: { block: CommandBlock }) {
  return (
    <div className="command-block">
      <div className="command-head"><span>{block.label}</span><span className="where">{block.where}</span><CopyButton command={block.command} /></div>
      <pre><code>{block.command}</code></pre>
    </div>
  );
}

function QuizPanel({ moduleId, passed, onPass }: { moduleId: string; passed: boolean; onPass: () => void }) {
  const quiz = quizzes[moduleId];
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === quiz.answer;

  function checkAnswer() {
    if (selected === null) return;
    setChecked(true);
    if (selected === quiz.answer) onPass();
  }

  return <section className={`quiz-panel ${passed ? "quiz-passed" : ""}`}>
    <div className="quiz-heading"><span className="quiz-kicker">+50 XP</span><div><p className="section-label">Checkpoint pengetahuan</p><h2>{passed ? "Checkpoint berhasil!" : quiz.question}</h2></div></div>
    {!passed && <div className="quiz-options">{quiz.options.map((option, index) => <button key={option} onClick={() => { setSelected(index); setChecked(false); }} className={`${selected === index ? "selected" : ""} ${checked && index === quiz.answer ? "correct" : ""} ${checked && selected === index && !correct ? "wrong" : ""}`}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>}
    {checked && !correct && <p className="quiz-feedback error">Belum tepat. Baca petunjuk modul dan coba lagi.</p>}
    {(passed || (checked && correct)) && <p className="quiz-feedback success">✓ {quiz.explanation}</p>}
    {!passed && <button className="primary-button quiz-submit" disabled={selected === null} onClick={checkAnswer}>{checked && !correct ? "Coba lagi" : "Periksa jawaban"}</button>}
  </section>;
}

function ModuleView({ module, done, stepDone, quizPassed, toggleDone, toggleStep, passQuiz }: { module: Module; done: boolean; stepDone: string[]; quizPassed: boolean; toggleDone: () => void; toggleStep: (index: number) => void; passQuiz: () => void }) {
  const finishedSteps = module.steps.filter((_, index) => stepDone.includes(`${module.id}:${index}`)).length;
  return (
    <article className="lesson" id={module.id}>
      <header className="lesson-header">
        <div className="lesson-icon"><Icon name={module.icon} size={28} /></div>
        <div className="lesson-title">
          <div className="lesson-meta"><span>Modul {module.number}</span><span>{module.duration}</span><span className={`level level-${module.level.toLowerCase()}`}>{module.level}</span></div>
          <h1>{module.title}</h1><p>{module.summary}</p>
        </div>
        <button className={`done-button ${done ? "is-done" : ""}`} onClick={toggleDone}><span>{done ? "✓" : "○"}</span>{done ? "Modul selesai" : "+100 XP · Selesaikan"}</button>
      </header>
      <div className="lesson-progress"><div><span style={{ width: `${Math.round((finishedSteps / module.steps.length) * 100)}%` }} /></div><p>{finishedSteps} dari {module.steps.length} langkah ditandai selesai</p></div>
      {module.warning && <div className="warning"><strong>Perhatian</strong><p>{module.warning}</p></div>}
      <section className="objectives"><p className="section-label">Target praktik</p><div>{module.objectives.map((item) => <span key={item}>✓ {item}</span>)}</div></section>
      <section className="steps">
        {module.steps.map((item, index) => { const checked = stepDone.includes(`${module.id}:${index}`); return <div className={`step ${checked ? "step-complete" : ""}`} key={item.title}>
          <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
          <div className="step-content"><div className="step-title-row"><h2>{item.title}</h2><button onClick={() => toggleStep(index)} className="step-check"><span>{checked ? "✓" : "+20"}</span>{checked ? "Sudah dicoba" : "Tandai langkah"}</button></div><p>{item.description}</p>{item.commands?.map((block) => <Command key={block.label} block={block} />)}{item.note && <div className="note">Catatan: {item.note}</div>}</div>
        </div>})}
      </section>
      {module.test && <section className="test-panel"><div className="test-heading"><Icon name="shield" /><div><p className="section-label">Uji hasil</p><h2>Pastikan layanan berhasil</h2></div></div>{module.test.map((block) => <Command key={block.label} block={block} />)}</section>}
      <QuizPanel moduleId={module.id} passed={quizPassed} onPass={passQuiz} />
    </article>
  );
}

export default function Home() {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [passedQuizzes, setPassedQuizzes] = useState<string[]>([]);
  const [streak, setStreak] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setCompleted(readStored("asj-progress", []));
    setCompletedSteps(readStored("asj-steps", []));
    setPassedQuizzes(readStored("asj-quizzes", []));
    const today = localDate();
    const previous = readStored<{ last: string; count: number }>("asj-streak", { last: "", count: 0 });
    const yesterday = localDate(-1);
    const next = previous.last === today ? previous : { last: today, count: previous.last === yesterday ? previous.count + 1 : 1 };
    localStorage.setItem("asj-streak", JSON.stringify(next)); setStreak(next.count);
  }, []);
  function saveList(setter: React.Dispatch<React.SetStateAction<string[]>>, key: string, update: (prev: string[]) => string[]) { setter((prev) => { const next = update(prev); localStorage.setItem(key, JSON.stringify(next)); return next; }); }
  function toggleDone(id: string) { saveList(setCompleted, "asj-progress", (prev) => { const adding = !prev.includes(id); if (adding) { setCelebrate(true); window.setTimeout(() => setCelebrate(false), 2400); } return adding ? [...prev, id] : prev.filter((x) => x !== id); }); }
  function toggleStep(id: string, index: number) { const key = `${id}:${index}`; saveList(setCompletedSteps, "asj-steps", (prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]); }
  function passQuiz(id: string) { saveList(setPassedQuizzes, "asj-quizzes", (prev) => prev.includes(id) ? prev : [...prev, id]); }
  const filtered = useMemo(() => modules.filter((m) => `${m.title} ${m.summary}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const percent = Math.round((completed.length / modules.length) * 100);
  const xp = completed.length * 100 + completedSteps.length * 20 + passedQuizzes.length * 50;
  const level = Math.floor(xp / 250) + 1;
  const levelProgress = Math.round(((xp % 250) / 250) * 100);
  const resumeModule = modules.find((module) => !completed.includes(module.id)) ?? modules[0];
  const dailyModule = modules[Math.floor(Date.now() / 86400000) % modules.length];
  function go(id: string) { setActive(id); setMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return (
    <div className="app-shell">
      {celebrate && <div className="celebration" role="status" aria-live="polite"><div className="confetti">{Array.from({ length: 18 }).map((_, i) => <i key={i} />)}</div><strong>Modul selesai! +100 XP</strong><span>Kerja bagus—server berikutnya menunggu.</span></div>}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark">W</div><div><strong>Wilda Ariffatul Faisalnur, S.Kom</strong><span>ASJ Learning Lab</span></div><button className="close-menu" onClick={() => setMenu(false)}>×</button></div>
        <div className="progress-card"><div className="progress-copy"><span>Level {level} · {xp} XP</span><strong>{percent}%</strong></div><div className="progress-track"><i style={{ width: `${percent}%` }} /></div><small>🔥 {streak} hari belajar · {completed.length}/{modules.length} modul</small></div>
        <nav aria-label="Navigasi modul">
          <button onClick={() => go("overview")} className={active === "overview" ? "active" : ""}><span className="nav-icon">⌂</span><span>Ringkasan Lab</span></button>
          <p className="nav-label">Materi praktik</p>
          {modules.map((m) => <button key={m.id} onClick={() => go(m.id)} className={active === m.id ? "active" : ""}><span className="nav-icon"><Icon name={m.icon} size={19} /></span><span>{m.title}</span>{completed.includes(m.id) && <b>✓</b>}</button>)}
        </nav>
        <div className="sidebar-foot"><span>🏆 NETWORK EXPLORER</span><p>SMKS Islam 1 Kota Blitar</p></div>
      </aside>
      {menu && <button className="overlay" onClick={() => setMenu(false)} aria-label="Tutup menu" />}
      <main className="main">
        <header className="topbar"><button className="menu-button" onClick={() => setMenu(true)} aria-label="Buka menu">☰</button><div className="crumb"><span>Administrasi Sistem Jaringan</span><b>/</b><strong>{active === "overview" ? "Ringkasan" : modules.find((m) => m.id === active)?.title}</strong></div><div className="platforms"><span>macOS</span><span>Windows 11</span><span>Docker</span></div></header>
        <div className="content">
          {active === "overview" ? <>
            <section className="hero">
              <div className="hero-copy"><span className="eyebrow">Praktik ringan • terisolasi • dapat diulang</span><h1>Belajar Debian Server<br/><em>tanpa VirtualBox.</em></h1><p>Lab interaktif untuk ASJ kelas XI TKJ. Disusun oleh Wilda Ariffatul Faisalnur, S.Kom. Jalankan server pada container terpisah, salin perintah, uji hasilnya, dan simpan progres langsung di browser.</p><div className="hero-actions"><button className="primary-button" onClick={() => go("persiapan")}>Mulai praktik <span>→</span></button><a className="secondary-button" href="#topologi">Lihat topologi</a></div></div>
              <div className="terminal-card"><div className="terminal-bar"><i/><i/><i/><span>client-asj — bash</span></div><pre><span className="prompt">siswa@client-asj:~$</span> docker ps{`\n`}<span className="muted">CONTAINER   SERVICE       STATUS</span>{`\n`}a8c21f31    web-asj       <span className="green">Up</span>{`\n`}e13b8d40    dns-asj       <span className="green">Up</span>{`\n`}b22c019f    db-asj        <span className="green">Up</span>{`\n\n`}<span className="prompt">siswa@client-asj:~$</span> curl web.sekolah.test{`\n`}<span className="cyan">&lt;h1&gt;Web Server ASJ XI TKJ&lt;/h1&gt;</span></pre></div>
            </section>
            <section className="stats"><div><strong>9</strong><span>Modul bertahap</span></div><div><strong>7</strong><span>Layanan server</span></div><div><strong>384 MB</strong><span>RAM mulai/container</span></div><div><strong>1</strong><span>Jaringan terisolasi</span></div></section>
            <section className="mission-grid">
              <div className="mission-card mission-main"><div><span className="eyebrow">Lanjutkan petualangan</span><h2>{resumeModule.title}</h2><p>{completed.length === 0 ? "Mulai dari fondasi lab dan kumpulkan XP pertamamu." : "Progresmu tersimpan di perangkat ini. Lanjut tepat dari tempat terakhir."}</p></div><button className="primary-button" onClick={() => go(resumeModule.id)}>Buka modul <span>→</span></button></div>
              <div className="mission-card daily-card"><span className="mission-icon">⚡</span><div><span className="eyebrow">Misi hari ini</span><h3>Taklukkan {dailyModule.title}</h3><p>Selesaikan satu langkah dan raih minimal 20 XP.</p></div><button onClick={() => go(dailyModule.id)} aria-label={`Buka ${dailyModule.title}`}>→</button></div>
              <div className="mission-card rank-card"><div className="rank-ring" style={{ "--rank": `${levelProgress * 3.6}deg` } as React.CSSProperties}><span>{level}</span></div><div><span className="eyebrow">Level teknisi</span><h3>{xp < 500 ? "Cable Rookie" : xp < 1000 ? "Service Operator" : "Network Hero"}</h3><p>{250 - (xp % 250)} XP menuju level berikutnya</p></div></div>
            </section>
            <section className="overview-section" id="topologi"><div className="section-intro"><span className="eyebrow">Arsitektur praktik</span><h2>Satu jaringan, layanan terpisah</h2><p>Kerusakan satu container tidak menghapus seluruh pekerjaan. Semua layanan diakses oleh Debian client melalui jaringan <code>lab-asj</code>.</p></div><div className="topology"><div className="topology-client"><Icon name="terminal"/><strong>client-asj</strong><span>172.25.0.10</span></div><div className="topology-line"><span>lab-asj • 172.25.0.0/24</span></div><div className="server-grid">{modules.slice(2,8).map((m) => <button key={m.id} onClick={() => go(m.id)}><Icon name={m.icon}/><strong>{m.title.replace(" Server", "")}</strong><span>{({web:".80",database:".100",ftp:".21",dns:".53",mail:".25",dhcp:"simulasi"} as Record<string,string>)[m.id]}</span></button>)}</div></div></section>
            <section className="module-list"><div className="section-intro"><span className="eyebrow">Kurikulum praktik</span><h2>Pilih modul pembelajaran</h2></div><div className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari Apache, DNS, mail..." /></div><div className="cards">{filtered.map((m) => <button className="module-card" key={m.id} onClick={() => go(m.id)}><div className="card-top"><span className="card-icon"><Icon name={m.icon}/></span><span className="module-no">{m.number}</span></div><h3>{m.title}</h3><p>{m.summary}</p><div className="card-meta"><span>{m.duration}</span><span>{m.level}</span>{completed.includes(m.id) && <span className="complete">✓ Selesai</span>}</div></button>)}</div></section>
            <section className="safety"><div><span className="eyebrow">Wajib dibaca</span><h2>DHCP hanya untuk simulasi aman</h2><p>Docker Desktop di macOS dan Windows berjalan melalui VM/NAT. Website mengajarkan instalasi, konfigurasi, dan validasi DHCP—bukan menyalakan DHCP liar pada LAN sekolah.</p><button className="secondary-button light" onClick={() => go("dhcp")}>Buka modul DHCP →</button></div><div className="safety-icon"><Icon name="shield" size={58}/></div></section>
          </> : <ModuleView key={active} module={modules.find((m) => m.id === active) ?? modules[0]} done={completed.includes(active)} stepDone={completedSteps} quizPassed={passedQuizzes.includes(active)} toggleDone={() => toggleDone(active)} toggleStep={(index) => toggleStep(active, index)} passQuiz={() => passQuiz(active)} />}
        </div>
        <footer><span>Lab Debian Docker • ASJ XI TKJ</span><span>Wilda Ariffatul Faisalnur, S.Kom • SMKS Islam 1 Kota Blitar</span></footer>
      </main>
    </div>
  );
}
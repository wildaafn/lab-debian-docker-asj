"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { modules as baseModules, type CommandBlock, type Module } from "./data";
import { curriculumModules } from "./curriculum";
import {
  AVAILABLE_CLASSES,
  exportStudentsToCSV,
  getActiveStudent,
  loginStudentUnified,
  registerStudentUnified,
  setActiveStudentSession,
  syncStudentProgressUnified,
  fetchAllStudentsUnified,
  deleteStudentUnified,
  verifyTeacherPinSecure,
  updateTeacherPinSecure,
  checkTeacherLockout,
  getDailyAssignment,
  saveDailyAssignment,
  playSoundEffect,
  type StudentProfile,
  type DailyAssignment,
} from "./auth";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  SUPABASE_SQL_SCHEMA,
  ASJ_STUDENTS_TABLE,
} from "./supabase";

const modules: Module[] = [...baseModules, ...curriculumModules];

type Quiz = { question: string; options: string[]; answer: number; explanation: string };

const quizzes: Partial<Record<string, Quiz>> = {
  persiapan: { question: "Apa tanda Docker siap dipakai?", options: ["Browser terbuka", "Docker Engine running", "Wi-Fi dimatikan"], answer: 1, explanation: "Docker Engine harus aktif sebelum container dapat dijalankan." },
  debian: { question: "Mengapa semua container memakai jaringan lab-asj?", options: ["Agar saling terhubung secara terisolasi", "Agar RAM bertambah", "Agar Docker tidak perlu diinstal"], answer: 0, explanation: "Bridge network membuat perangkat lab saling berkomunikasi tanpa mencampuri LAN sekolah." },
  web: { question: "Arti pemetaan port 8080:80 adalah...", options: ["Port 80 host menuju 8080 container", "Port 8080 host menuju 80 container", "Kedua port dinonaktifkan"], answer: 1, explanation: "Akses ke port 8080 host diteruskan ke Apache pada port 80 di container." },
  database: { question: "Fungsi volume data-db-asj adalah...", options: ["Menyimpan data agar tetap ada", "Mengganti password otomatis", "Mempercepat internet"], answer: 0, explanation: "Volume membuat data database tetap tersimpan walau container dibuat ulang." },
  ftp: { question: "Mengapa FTP lab ini tidak cocok untuk data rahasia?", options: ["FTP terlalu cepat", "FTP dasar tidak mengenkripsi trafik", "FTP hanya bekerja di macOS"], answer: 1, explanation: "FTP dasar mengirim autentikasi dan data tanpa enkripsi; gunakan hanya di jaringan lab." },
  dns: { question: "Record DNS untuk server web menggunakan tipe...", options: ["MX", "A", "TXT"], answer: 1, explanation: "Record A memetakan nama host ke alamat IPv4." },
  mail: { question: "Port yang dilatih untuk SMTP di dalam container adalah...", options: ["25", "53", "3306"], answer: 0, explanation: "SMTP memakai port 25 di container, lalu dipetakan ke 2525 pada host." },
  dhcp: { question: "Di mana DHCP praktik boleh diuji?", options: ["LAN sekolah aktif", "Jaringan lab terisolasi", "Wi-Fi publik"], answer: 1, explanation: "DHCP liar dapat mengubah gateway dan DNS pengguna lain, jadi wajib terisolasi." },
  pengelolaan: { question: "Langkah pertama saat container bermasalah adalah...", options: ["Hapus semua volume", "Periksa status dan log", "Instal ulang komputer"], answer: 1, explanation: "Diagnosis status, log, resource, dan jaringan harus dilakukan sebelum menghapus apa pun." },
  "os-jaringan": { question: "Mengapa server sering memakai CLI?", options: ["Lebih ringan untuk layanan server", "Agar tidak bisa diremote", "Agar internet lebih cepat"], answer: 0, explanation: "CLI lebih hemat resource dan umum dipakai pada server produksi." },
  remote: { question: "Protokol remote yang aman untuk login server adalah...", options: ["Telnet", "SSH", "FTP"], answer: 1, explanation: "SSH mengenkripsi sesi login, sedangkan Telnet tidak." },
  proxy: { question: "Fungsi ACL pada Squid adalah...", options: ["Mengatur siapa/apa yang boleh diakses", "Menghapus Docker", "Mengganti sistem operasi"], answer: 0, explanation: "ACL dipakai untuk membatasi sumber, tujuan, atau aturan akses proxy." },
  "hosting-panel": { question: "Control panel hosting membantu mengelola...", options: ["Website, domain, database, email, dan backup", "Hanya keyboard", "Hanya kabel jaringan"], answer: 0, explanation: "Control panel menyatukan pengelolaan layanan hosting dalam satu antarmuka." },
  "security-troubleshooting": { question: "Langkah troubleshooting paling awal adalah...", options: ["Hapus semua container", "Cek status dan log", "Ganti laptop"], answer: 1, explanation: "Status dan log membantu menemukan penyebab sebelum melakukan tindakan berisiko." },
};

const defaultQuiz: Quiz = {
  question: "Apa tujuan utama modul ini?",
  options: ["Memahami konsep lalu mempraktikkannya dengan aman", "Menghafal perintah tanpa tahu fungsi", "Menghapus semua konfigurasi"],
  answer: 0,
  explanation: "Setiap modul ASJ menghubungkan konsep jaringan dengan praktik aman di lingkungan lab.",
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
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
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name] ?? iconPaths.shield}</svg>;
}

function normalizeCmd(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function calcMatchPercent(typed: string, target: string): number {
  const a = normalizeCmd(typed);
  const b = normalizeCmd(target);
  if (b.length === 0) return 100;
  if (a.length === 0) return 0;
  let matches = 0;
  let bIdx = 0;
  for (let i = 0; i < a.length && bIdx < b.length; i++) {
    if (a[i] === b[bIdx]) { matches++; bIdx++; }
  }
  return Math.min(100, Math.round((matches / b.length) * 100));
}

type TypoWarning = {
  line: number;
  typed: string;
  expected: string;
  wrongWord: string;
  correctWord: string;
  severity: "error" | "warning" | "info";
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function detectTypos(typed: string, target: string): TypoWarning[] {
  const warnings: TypoWarning[] = [];
  const typedLines = typed.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const targetLines = target.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  if (typedLines.length === 0) return warnings;

  for (let i = 0; i < typedLines.length; i++) {
    const tl = typedLines[i];
    let bestMatch = 0;
    let bestDist = Infinity;
    for (let j = 0; j < targetLines.length; j++) {
      const d = levenshtein(tl.toLowerCase(), targetLines[j].toLowerCase());
      if (d < bestDist) { bestDist = d; bestMatch = j; }
    }

    const expected = targetLines[bestMatch] ?? "";
    if (!expected || tl === expected) continue;

    const typedWords = tl.split(/\s+/);
    const expectedWords = expected.split(/\s+/);

    for (let w = 0; w < typedWords.length; w++) {
      const tw = typedWords[w];
      let closestWord = expectedWords[w] ?? "";
      let closestDist = closestWord ? levenshtein(tw.toLowerCase(), closestWord.toLowerCase()) : Infinity;

      for (let k = Math.max(0, w - 2); k < Math.min(expectedWords.length, w + 3); k++) {
        const d = levenshtein(tw.toLowerCase(), expectedWords[k].toLowerCase());
        if (d < closestDist) { closestDist = d; closestWord = expectedWords[k]; }
      }

      if (closestDist === 0) continue;

      const maxLen = Math.max(tw.length, closestWord.length);
      if (maxLen === 0) continue;
      const ratio = closestDist / maxLen;

      if (closestDist <= 3 && ratio < 0.6) {
        const severity: "error" | "warning" = closestDist === 1 ? "warning" : "error";
        warnings.push({ line: i + 1, typed: tl, expected, wrongWord: tw, correctWord: closestWord, severity });
      } else if (tw.length > 2 && !expectedWords.some((ew) => ew.toLowerCase() === tw.toLowerCase())) {
        if (closestWord && closestDist <= 5 && ratio < 0.7) {
          warnings.push({ line: i + 1, typed: tl, expected, wrongWord: tw, correctWord: closestWord, severity: "error" });
        }
      }
    }

    const criticalChars = ["'", '"', "|", ";", ">", "<", "{", "}", "(", ")"];
    for (const ch of criticalChars) {
      const typedCount = (tl.match(new RegExp(`\\${ch}`, "g")) || []).length;
      const expectedCount = (expected.match(new RegExp(`\\${ch}`, "g")) || []).length;
      if (typedCount < expectedCount) {
        warnings.push({
          line: i + 1,
          typed: tl,
          expected,
          wrongWord: `(kurang ${expectedCount - typedCount}× '${ch}')`,
          correctWord: ch,
          severity: "info",
        });
      }
    }
  }

  const seen = new Set<string>();
  return warnings.filter((w) => {
    const key = `${w.line}:${w.wrongWord}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function TypoWarnings({ typed, target }: { typed: string; target: string }) {
  const warnings = useMemo(() => detectTypos(typed, target), [typed, target]);

  if (warnings.length === 0) {
    if (typed.trim().length > 5) {
      return (
        <div className="typo-panel typo-ok">
          <span className="typo-icon">✅</span>
          <span>Tidak ada typo terdeteksi. Script siap dijalankan!</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="typo-panel typo-has-errors">
      <div className="typo-header">
        <span className="typo-icon">⚠️</span>
        <span>Terdeteksi {warnings.length} kemungkinan kesalahan ketik:</span>
      </div>
      <div className="typo-list">
        {warnings.map((w, i) => (
          <div key={i} className={`typo-item typo-${w.severity}`}>
            <span className="typo-line-num">Baris {w.line}</span>
            {w.severity === "info" ? (
              <span className="typo-detail"><span className="typo-missing">{w.wrongWord}</span></span>
            ) : (
              <span className="typo-detail">
                <span className="typo-wrong">{w.wrongWord}</span>
                <span className="typo-arrow">→</span>
                <span className="typo-correct">{w.correctWord}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Command({ block, storageKey, onCommandTyped }: { block: CommandBlock; storageKey: string; onCommandTyped?: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    const saved = readStored<boolean>(`asj-unlock-${storageKey}`, false);
    if (saved) setUnlocked(true);
  }, [storageKey]);

  const matchPercent = useMemo(() => calcMatchPercent(typedText, block.command), [typedText, block.command]);

  useEffect(() => {
    if (matchPercent >= 80 && !unlocked) {
      setUnlocked(true);
      localStorage.setItem(`asj-unlock-${storageKey}`, "true");
      playSoundEffect("success");
      if (onCommandTyped) onCommandTyped();
    }
  }, [matchPercent, unlocked, storageKey, onCommandTyped]);

  const handleUnderstood = useCallback(() => {
    setUnderstood(true);
    setUnlocked(true);
    localStorage.setItem(`asj-unlock-${storageKey}`, "true");
    playSoundEffect("success");
    if (onCommandTyped) onCommandTyped();
  }, [storageKey, onCommandTyped]);

  async function copy() {
    if (!unlocked) return;
    await navigator.clipboard.writeText(block.command);
    setCopied(true);
    playSoundEffect("click");
    window.setTimeout(() => setCopied(false), 1600);
  }

  const copyClass = copied ? "copy-button copied" : unlocked ? "copy-button copy-unlocked" : "copy-button copy-locked";
  const copyLabel = copied ? "✓ Tersalin" : unlocked ? "📋 Salin" : "🔒 Ketik dulu";

  return (
    <div className="command-block">
      <div className="command-head">
        <span>{block.label}</span>
        <span className="where">{block.where}</span>
        <button className={copyClass} onClick={copy} aria-label="Salin perintah" disabled={!unlocked}>
          {copyLabel}
        </button>
      </div>
      <pre><code>{block.command}</code></pre>

      {block.explanation && (
        <>
          <button className="explanation-toggle" onClick={() => { setShowExplanation(!showExplanation); playSoundEffect("click"); }}>
            <span className={`toggle-arrow ${showExplanation ? "open" : ""}`}>▶</span>
            📖 Penjelasan Baris Script
          </button>
          <div className={`explanation-content ${showExplanation ? "visible" : ""}`}>
            {block.explanation.split("\n").map((line, i) => {
              const arrowIdx = line.indexOf("→");
              if (arrowIdx > -1) {
                return (
                  <span className="line-explain" key={i}>
                    <span className="cmd-part">{line.substring(0, arrowIdx)}</span>
                    <span className="desc-part">→{line.substring(arrowIdx + 1)}</span>
                  </span>
                );
              }
              return <span className="line-explain" key={i}>{line}</span>;
            })}
          </div>
        </>
      )}

      {!unlocked && (
        <div className="typing-guard">
          <div className="typing-guard-label">
            <span>⌨️ Ketik ulang perintah di atas</span>
            <span className={`match-pct ${matchPercent >= 80 ? "good" : ""}`}>{matchPercent}%</span>
          </div>
          <textarea
            className="typing-area"
            placeholder="Ketik ulang perintah yang ada di atas untuk membuka tombol Salin..."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            rows={3}
          />
          <div className="typing-progress-bar"><span style={{ width: `${matchPercent}%` }} /></div>
          <TypoWarnings typed={typedText} target={block.command} />
          {showExplanation && !understood && (
            <button className="understood-btn" onClick={handleUnderstood}>
              ✅ Saya sudah membaca penjelasan dan paham fungsinya
            </button>
          )}
          {understood && (
            <button className="understood-btn confirmed" disabled>
              ✅ Sudah dikonfirmasi paham
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuizPanel({ moduleId, passed, onPass }: { moduleId: string; passed: boolean; onPass: () => void }) {
  const quiz = quizzes[moduleId] ?? defaultQuiz;
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === quiz.answer;

  function checkAnswer() {
    if (selected === null) return;
    setChecked(true);
    if (selected === quiz.answer) {
      playSoundEffect("levelup");
      onPass();
    } else {
      playSoundEffect("error");
    }
  }

  return (
    <section className={`quiz-panel ${passed ? "quiz-passed" : ""}`}>
      <div className="quiz-heading">
        <span className="quiz-kicker">+50 XP</span>
        <div><p className="section-label">Checkpoint pengetahuan</p><h2>{passed ? "Checkpoint berhasil!" : quiz.question}</h2></div>
      </div>
      {!passed && (
        <div className="quiz-options">
          {quiz.options.map((option, index) => (
            <button
              key={option}
              onClick={() => { setSelected(index); setChecked(false); playSoundEffect("click"); }}
              className={`${selected === index ? "selected" : ""} ${checked && index === quiz.answer ? "correct" : ""} ${checked && selected === index && !correct ? "wrong" : ""}`}
            >
              <span>{String.fromCharCode(65 + index)}</span>{option}
            </button>
          ))}
        </div>
      )}
      {checked && !correct && <p className="quiz-feedback error">Belum tepat. Baca petunjuk modul dan coba lagi.</p>}
      {(passed || (checked && correct)) && <p className="quiz-feedback success">✓ {quiz.explanation}</p>}
      {!passed && (
        <button className="primary-button quiz-submit" disabled={selected === null} onClick={checkAnswer}>
          {checked && !correct ? "Coba lagi" : "Periksa jawaban"}
        </button>
      )}
    </section>
  );
}

function ModuleView({
  module,
  done,
  stepDone,
  quizPassed,
  toggleDone,
  toggleStep,
  passQuiz,
  onCommandTyped,
}: {
  module: Module;
  done: boolean;
  stepDone: string[];
  quizPassed: boolean;
  toggleDone: () => void;
  toggleStep: (index: number) => void;
  passQuiz: () => void;
  onCommandTyped: () => void;
}) {
  const finishedSteps = module.steps.filter((_, index) => stepDone.includes(`${module.id}:${index}`)).length;
  let cmdCounter = 0;

  return (
    <article className="lesson" id={module.id}>
      <header className="lesson-header">
        <div className="lesson-icon"><Icon name={module.icon} size={30} /></div>
        <div className="lesson-title">
          <div className="lesson-meta">
            <span>Modul {module.number}</span>
            <span>{module.duration}</span>
            <span className={`level level-${module.level.toLowerCase()}`}>{module.level}</span>
          </div>
          <h1>{module.title}</h1>
          <p>{module.summary}</p>
        </div>
        <button className={`done-button ${done ? "is-done" : ""}`} onClick={toggleDone}>
          <span>{done ? "✓" : "○"}</span>
          {done ? "Modul selesai" : "+100 XP · Selesaikan"}
        </button>
      </header>
      <div className="lesson-progress">
        <div><span style={{ width: `${Math.round((finishedSteps / module.steps.length) * 100)}%` }} /></div>
        <p>{finishedSteps} dari {module.steps.length} langkah ditandai selesai</p>
      </div>
      {module.warning && <div className="warning"><strong>Perhatian</strong><p>{module.warning}</p></div>}
      <section className="objectives">
        <p className="section-label">Target praktik</p>
        <div>{module.objectives.map((item) => <span key={item}>✓ {item}</span>)}</div>
      </section>

      {module.theory && (
        <section className="theory-panel">
          <div className="theory-header">
            <span className="theory-badge">🧠 Landasan Teori & Konsep</span>
            <h2>{module.theory.title}</h2>
            <p className="theory-summary">{module.theory.summary}</p>
          </div>
          <div className="theory-grid">
            {module.theory.points.map((pt, i) => (
              <div key={i} className="theory-point">
                <strong>💡 {pt.term}</strong>
                <p>{pt.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="steps">
        {module.steps.map((item, index) => {
          const checked = stepDone.includes(`${module.id}:${index}`);
          return (
            <div className={`step ${checked ? "step-complete" : ""}`} key={item.title}>
              <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="step-content">
                <div className="step-title-row">
                  <h2>{item.title}</h2>
                  <button onClick={() => toggleStep(index)} className="step-check">
                    <span>{checked ? "✓" : "+20"}</span>
                    {checked ? "Sudah dicoba" : "Tandai langkah"}
                  </button>
                </div>
                <p>{item.description}</p>
                {item.commands?.map((block) => {
                  const key = `${module.id}-${cmdCounter++}`;
                  return <Command key={key} block={block} storageKey={key} onCommandTyped={onCommandTyped} />;
                })}
                {item.note && <div className="note">Catatan: {item.note}</div>}
              </div>
            </div>
          );
        })}
      </section>
      {module.test && (
        <section className="test-panel">
          <div className="test-heading">
            <Icon name="shield" />
            <div><p className="section-label">Uji hasil</p><h2>Pastikan layanan berhasil</h2></div>
          </div>
          {module.test.map((block) => {
            const key = `${module.id}-test-${cmdCounter++}`;
            return <Command key={key} block={block} storageKey={key} onCommandTyped={onCommandTyped} />;
          })}
        </section>
      )}
      <QuizPanel moduleId={module.id} passed={quizPassed} onPass={passQuiz} />
    </article>
  );
}

/* ========================================================================= */
/* DIGITAL CERTIFICATE MODAL                                                 */
/* ========================================================================= */
function CertificateModal({
  student,
  isOpen,
  onClose,
}: {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !student) return null;

  function handlePrint() {
    window.print();
  }

  const totalMod = modules.length;
  const isFinishedAll = student.completedModules.length >= totalMod;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog certificate-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏆 Sertifikat Kompetensi Praktik ASJ</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="certificate-frame" id="certificate-print-area">
          <div className="certificate-border">
            <div className="certificate-inner">
              <div className="cert-badge-ribbon">SMKS ISLAM 1 BLITAR</div>
              <div className="cert-header">
                <h3>SERTIFIKAT KOMPETENSI PRAKTIK</h3>
                <p>ADMINISTRASI SISTEM JARINGAN (ASJ) — DEBIAN DOCKER LAB</p>
              </div>

              <p className="cert-to">Diberikan secara resmi kepada:</p>
              <h1 className="cert-student-name">{student.name}</h1>
              <p className="cert-meta">
                NISN: <strong>{student.nisn}</strong> • Kelas: <strong>{student.className}</strong>
              </p>

              <div className="cert-body">
                <p>
                  Telah berhasil menyelesaikan seluruh rangkaian praktikum laboratorium Administrasi Sistem Jaringan berbasis Debian Linux dan Docker secara mandiri, meliputi konfigurasi OS Jaringan, Remote Server SSH, Web Server, Database, FTP, DNS BIND9, Mail Server, DHCP, Proxy Server, Control Panel Hosting, serta Keamanan & Troubleshooting Server.
                </p>
              </div>

              <div className="cert-scores-row">
                <div>
                  <span>Status Kelulusan</span>
                  <strong>{isFinishedAll ? "LULUS LENGKAP (100%)" : `${student.completedModules.length}/${totalMod} MODUL`}</strong>
                </div>
                <div>
                  <span>Total XP Capaian</span>
                  <strong>{student.xp} XP (Level {student.level})</strong>
                </div>
                <div>
                  <span>Checkpoint Kuis</span>
                  <strong>{student.passedQuizzes.length} Lulus</strong>
                </div>
              </div>

              <div className="cert-footer">
                <div className="cert-date-side">
                  <span>Kota Blitar, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <p>Kode Verifikasi: <code>ASJ-{student.nisn}-{student.level}X</code></p>
                </div>
                <div className="cert-signature-side">
                  <span>Guru Pembimbing Praktik</span>
                  <div className="digital-sign-line" />
                  <strong>Wilda Ariffatul Faisalnur, S.Kom</strong>
                  <small>NIP / Pengampu Mata Pelajaran ASJ</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions-footer">
          <button className="secondary-button" onClick={onClose}>Tutup</button>
          <button className="primary-button" onClick={handlePrint}>🖨️ Cetak / Simpan PDF</button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* CLASS LEADERBOARD MODAL                                                   */
/* ========================================================================= */
function LeaderboardModal({
  isOpen,
  onClose,
  allStudents,
}: {
  isOpen: boolean;
  onClose: () => void;
  allStudents: StudentProfile[];
}) {
  const [selectedClass, setSelectedClass] = useState<string>("Semua");

  if (!isOpen) return null;

  const filtered = allStudents
    .filter((s) => selectedClass === "Semua" || s.className === selectedClass)
    .sort((a, b) => b.xp - a.xp || b.completedModules.length - a.completedModules.length);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog leaderboard-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Papan Peringkat</span>
            <h2>🏆 Leaderboard Praktikan ASJ</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="leaderboard-tabs">
          <button
            className={`class-tab ${selectedClass === "Semua" ? "active" : ""}`}
            onClick={() => setSelectedClass("Semua")}
          >
            Semua Kelas
          </button>
          {AVAILABLE_CLASSES.map((cls) => (
            <button
              key={cls}
              className={`class-tab ${selectedClass === cls ? "active" : ""}`}
              onClick={() => setSelectedClass(cls)}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="leaderboard-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada praktikan terdaftar di kelas ini.</p>
            </div>
          ) : (
            filtered.map((s, idx) => (
              <div key={s.id} className={`leaderboard-item rank-${idx + 1}`}>
                <div className="leaderboard-rank">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </div>
                <div className="leaderboard-info">
                  <strong>{s.name}</strong>
                  <span>{s.className} • {s.completedModules.length}/14 Modul • 🔥 {s.streak || 1} Hari</span>
                </div>
                <div className="leaderboard-score">
                  <strong>{s.xp} XP</strong>
                  <small>Level {s.level}</small>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions-footer">
          <button className="primary-button" onClick={onClose} style={{ marginLeft: "auto" }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* QUICK COMMAND PALETTE (CTRL + K)                                          */
/* ========================================================================= */
function QuickSearchModal({
  isOpen,
  onClose,
  onSelectModule,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  const results = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.summary.toLowerCase().includes(query.toLowerCase()) ||
      m.objectives.some((o) => o.toLowerCase().includes(query.toLowerCase())) ||
      m.steps.some((s) => s.title.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog quick-search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="quick-search-input-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Cari materi, konsep (Debian, DNS, SSH, Web), atau modul..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd>ESC</kbd>
        </div>

        <div className="quick-search-results">
          {results.length === 0 ? (
            <div className="quick-empty">Tidak ada materi yang cocok dengan "{query}".</div>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                className="quick-search-item"
                onClick={() => {
                  onSelectModule(m.id);
                  onClose();
                }}
              >
                <div className="quick-item-icon"><Icon name={m.icon} size={20} /></div>
                <div className="quick-item-text">
                  <strong>Modul {m.number}: {m.title}</strong>
                  <small>{m.summary}</small>
                </div>
                <span className="quick-item-level">{m.level}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* INTERACTIVE TOPOLOGY SECTION                                              */
/* ========================================================================= */
function InteractiveTopology({
  onSelectModule,
}: {
  onSelectModule: (moduleId: string) => void;
}) {
  const [activeServer, setActiveServer] = useState<string>("web");
  const [packetAnimated, setPacketAnimated] = useState(false);

  const serverDetails: Record<
    string,
    { name: string; ip: string; port: string; service: string; config: string; moduleId: string; desc: string }
  > = {
    web: { name: "web-asj", ip: "172.25.0.80", port: "8080 -> 80", service: "Apache HTTP Server 2.4", config: "/etc/apache2/sites-available/", moduleId: "web", desc: "Melayani halaman web HTML & Virtual Host." },
    dns: { name: "dns-asj", ip: "172.25.0.53", port: "1053 -> 53 UDP/TCP", service: "BIND9 DNS Server", config: "/etc/bind/named.conf.local", moduleId: "dns", desc: "Menerjemahkan nama domain *.sekolah.test." },
    database: { name: "db-asj", ip: "172.25.0.100", port: "3307 -> 3306", service: "MariaDB Enterprise 11", config: "data-db-asj:/var/lib/mysql", moduleId: "database", desc: "Menyimpan data siswa dan database sekolah." },
    ftp: { name: "ftp-asj", ip: "172.25.0.21", port: "2121 -> 21 & 30000-30009", service: "vsftpd (Secure FTP)", config: "/etc/vsftpd.conf", moduleId: "ftp", desc: "Transfer dan upload berkas website siswa." },
    mail: { name: "mail-asj", ip: "172.25.0.25", port: "2525 -> 25 & 1143 -> 143", service: "Postfix & Dovecot", config: "/etc/postfix/main.cf", moduleId: "mail", desc: "Kirim kirim email lokal sekolah.test." },
    dhcp: { name: "dhcp-asj", ip: "172.25.0.150-180", port: "67/68 UDP", service: "ISC DHCP Server", config: "/etc/dhcp/dhcpd.conf", moduleId: "dhcp", desc: "Simulasi pembagian IP Dinamis aman." },
    proxy: { name: "proxy-asj", ip: "172.25.0.88", port: "3128 -> 3128", service: "Squid Proxy Server", config: "/etc/squid/squid.conf", moduleId: "proxy", desc: "Penyaringan ACL & Caching akses web." },
    remote: { name: "remote-asj", ip: "172.25.0.22", port: "2222 -> 22", service: "OpenSSH Server 9", config: "/etc/ssh/sshd_config", moduleId: "remote", desc: "Remote command line aman terenkripsi." },
  };

  function handleServerClick(key: string) {
    setActiveServer(key);
    setPacketAnimated(true);
    playSoundEffect("click");
    setTimeout(() => setPacketAnimated(false), 900);
  }

  const cur = serverDetails[activeServer] || serverDetails.web;

  return (
    <section className="overview-section" id="topologi">
      <div className="section-intro">
        <span className="eyebrow">Topologi Interaktif Dinamis</span>
        <h2>Satu Jaringan Bridge, Layanan Terisolasi</h2>
        <p>Klik salah satu server di bawah untuk melihat animasi alur paket data dari <code>client-asj</code> dan inspeksi port layanannya:</p>
      </div>

      <div className="topology">
        {/* Client */}
        <div className="topology-client active-client">
          <Icon name="terminal" />
          <div>
            <strong>client-asj (Debian Client)</strong>
            <span>172.25.0.10 • Workstation Penguji</span>
          </div>
        </div>

        {/* Dynamic Packet Animated Wire */}
        <div className="topology-line">
          <span className="wire-label">lab-asj • 172.25.0.0/24 (Bridge Network)</span>
          {packetAnimated && <div className="packet-bullet" />}
        </div>

        {/* Server Grid */}
        <div className="server-grid">
          {Object.entries(serverDetails).map(([key, s]) => (
            <button
              key={key}
              className={`server-node-btn ${activeServer === key ? "active" : ""}`}
              onClick={() => handleServerClick(key)}
            >
              <Icon name={key === "database" ? "database" : key === "dns" ? "dns" : key === "web" ? "web" : key === "mail" ? "mail" : key === "ftp" ? "folder" : key === "dhcp" ? "dhcp" : "shield"} />
              <strong>{s.name}</strong>
              <span>{s.ip}</span>
            </button>
          ))}
        </div>

        {/* Live Server Inspector Card */}
        <div className="topology-inspector-card">
          <div className="inspector-left">
            <span className="inspector-badge">🔎 Live Inspector: {cur.name}</span>
            <h3>{cur.service}</h3>
            <p>{cur.desc}</p>
            <div className="inspector-details">
              <div><span>Alamat IP:</span> <code>{cur.ip}</code></div>
              <div><span>Pemetaan Port:</span> <code>{cur.port}</code></div>
              <div><span>File Konfigurasi:</span> <code>{cur.config}</code></div>
            </div>
          </div>
          <button className="primary-button" onClick={() => onSelectModule(cur.moduleId)}>
            Buka Modul Praktik →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================= */
/* AUTH & STUDENT PROGRESS MODAL                                              */
/* ========================================================================= */
function AuthModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onSuccess: (student: StudentProfile) => void;
}) {
  const [currentMode, setCurrentMode] = useState<"login" | "register">(mode);
  const [name, setName] = useState("");
  const [nisn, setNisn] = useState("");
  const [className, setClassName] = useState("XI TKJ 1");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
    setError("");
    setSuccess("");
  }, [mode, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (currentMode === "register") {
        const res = await registerStudentUnified(name, nisn, className, pin);
        if (res.success && res.student) {
          playSoundEffect("levelup");
          setSuccess(res.message);
          setTimeout(() => onSuccess(res.student!), 700);
        } else {
          playSoundEffect("error");
          setError(res.message);
        }
      } else {
        const res = await loginStudentUnified(nisn, pin);
        if (res.success && res.student) {
          playSoundEffect("success");
          setSuccess(res.message);
          setTimeout(() => onSuccess(res.student!), 700);
        } else {
          playSoundEffect("error");
          setError(res.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog auth-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="auth-tab-switch">
            <button
              className={`auth-tab ${currentMode === "login" ? "active" : ""}`}
              onClick={() => { setCurrentMode("login"); setError(""); playSoundEffect("click"); }}
            >
              Masuk Siswa
            </button>
            <button
              className={`auth-tab ${currentMode === "register" ? "active" : ""}`}
              onClick={() => { setCurrentMode("register"); setError(""); playSoundEffect("click"); }}
            >
              Daftar Akun Baru
            </button>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-alert error">⚠️ {error}</div>}
          {success && <div className="auth-alert success">✅ {success}</div>}

          {currentMode === "register" && (
            <div className="form-group">
              <label>Nama Lengkap Siswa</label>
              <input
                type="text"
                placeholder="Contoh: Ahmad Fauzi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label>NIS / NISN / ID Siswa</label>
            <input
              type="text"
              placeholder="Contoh: 12345"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              required
            />
          </div>

          {currentMode === "register" && (
            <div className="form-group">
              <label>Kelas</label>
              <select value={className} onChange={(e) => setClassName(e.target.value)}>
                {AVAILABLE_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Password / PIN</label>
            <input
              type="password"
              placeholder="Masukkan PIN Anda"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? "Memproses..." : currentMode === "register" ? "Daftar & Mulai Belajar →" : "Masuk ke Lab →"}
          </button>

          <p className="auth-footer-hint">
            {currentMode === "register"
              ? "Progress belajar Anda tersinkronisasi otomatis ke database Supabase Cloud & tersimpan aman."
              : "Belum punya akun? Klik tab 'Daftar Akun Baru' di atas."}
          </p>
        </form>
      </div>
    </div>
  );
}

function StudentProgressModal({
  student,
  isOpen,
  onClose,
  onLogout,
  onOpenCertificate,
}: {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenCertificate: () => void;
}) {
  if (!isOpen || !student) return null;

  const totalMod = modules.length;
  const modPercent = Math.round((student.completedModules.length / totalMod) * 100);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog progress-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Rapor Digital Siswa</span>
            <h2>{student.name}</h2>
            <span className="badge-class">{student.className} • NISN: {student.nisn}</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="student-stats-overview">
          <div className="stat-card">
            <strong>{student.completedModules.length}/{totalMod}</strong>
            <span>Modul Selesai ({modPercent}%)</span>
          </div>
          <div className="stat-card">
            <strong>{student.xp} XP</strong>
            <span>Level {student.level}</span>
          </div>
          <div className="stat-card">
            <strong>{student.passedQuizzes.length}</strong>
            <span>Kuis Terlampaui</span>
          </div>
          <div className="stat-card">
            <strong>{student.totalTypedCommands || 0}</strong>
            <span>Script Diketik</span>
          </div>
        </div>

        <div className="cert-banner-callout">
          <div className="cert-banner-text">
            <strong>🎓 Sertifikat Kompetensi Praktik ASJ</strong>
            <p>Dapat dicetak atau diunduh sebagai portofolio resmi keterampilan laboratorium jaringan.</p>
          </div>
          <button className="primary-button" onClick={() => { onClose(); onOpenCertificate(); }}>
            Lihat Sertifikat 📜
          </button>
        </div>

        <div className="module-checklist-summary">
          <h3>Daftar Modul Kurikulum ({student.completedModules.length}/{totalMod})</h3>
          <div className="checklist-grid">
            {modules.map((m) => {
              const isDone = student.completedModules.includes(m.id);
              const quizDone = student.passedQuizzes.includes(m.id);
              return (
                <div key={m.id} className={`checklist-item ${isDone ? "done" : ""}`}>
                  <span className="check-icon">{isDone ? "✓" : "○"}</span>
                  <div className="check-info">
                    <strong>{m.number}. {m.title}</strong>
                    <small>{quizDone ? "✅ Kuis Lulus" : "⏳ Kuis Belum"}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-actions-footer">
          <button className="secondary-button" onClick={onLogout}>🚪 Keluar dari Akun</button>
          <button className="primary-button" onClick={onClose}>Lanjut Belajar →</button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* TEACHER DASHBOARD (PORTAL PAK WILDA)                                       */
/* ========================================================================= */
function TeacherPortal({
  onBack,
  onOpenCertificateForStudent,
}: {
  onBack: () => void;
  onOpenCertificateForStudent: (s: StudentProfile) => void;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [newPin, setNewPin] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState("");
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  // Daily Assignment State
  const [assignment, setAssignment] = useState<DailyAssignment>(getDailyAssignment());
  const [assignmentSavedMsg, setAssignmentSavedMsg] = useState("");

  useEffect(() => {
    const isTeacherAuth = sessionStorage.getItem("asj_teacher_auth");
    if (isTeacherAuth === "true") {
      setAuthenticated(true);
      loadStudents();
    }
  }, []);

  async function loadStudents() {
    setLoadingRefresh(true);
    try {
      const data = await fetchAllStudentsUnified();
      setStudents(data);
    } finally {
      setLoadingRefresh(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const lockout = checkTeacherLockout();
    if (lockout.locked) {
      setPinError(`Akses terkunci sementara karena 5x kesalahan. Silakan coba lagi dalam ${lockout.remainingSeconds} detik.`);
      return;
    }

    const isValid = await verifyTeacherPinSecure(pinInput);
    if (isValid) {
      playSoundEffect("levelup");
      setAuthenticated(true);
      sessionStorage.setItem("asj_teacher_auth", "true");
      loadStudents();
      setPinError("");
    } else {
      playSoundEffect("error");
      const retry = checkTeacherLockout();
      if (retry.locked) {
        setPinError("PIN salah berulang kali! Akses ke Portal Guru dikunci selama 10 menit demi keamanan.");
      } else {
        setPinError("PIN Otorisasi Guru tidak valid. Silakan coba lagi.");
      }
    }
  }

  function handleExport() {
    const filtered = getFilteredStudents();
    const csv = exportStudentsToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap_nilai_asj_${selectedClass.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (confirm(`Yakin ingin menghapus data siswa "${name}"? Data akan dihapus dari Supabase Cloud dan perangkat.`)) {
      await deleteStudentUnified(id);
      loadStudents();
      if (selectedStudent?.id === id) setSelectedStudent(null);
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMsg("PIN minimal 4 karakter.");
      return;
    }
    const ok = await updateTeacherPinSecure(newPin);
    if (ok) {
      playSoundEffect("success");
      setPinChangeMsg("✅ PIN Guru berhasil diperbarui & dienkripsi dengan SHA-256!");
      setNewPin("");
    }
  }

  function handleSaveAssignment(e: React.FormEvent) {
    e.preventDefault();
    saveDailyAssignment(assignment);
    playSoundEffect("success");
    setAssignmentSavedMsg("✅ Tugas harian berhasil diperbarui untuk semua siswa!");
    setTimeout(() => setAssignmentSavedMsg(""), 3000);
  }

  function toggleAssignmentModule(modId: string) {
    setAssignment((prev) => {
      const exists = prev.targetModules.includes(modId);
      const targetModules = exists
        ? prev.targetModules.filter((m) => m !== modId)
        : [...prev.targetModules, modId];
      return { ...prev, targetModules };
    });
  }

  async function copySqlSchema() {
    await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  }

  function getFilteredStudents() {
    return students.filter((s) => {
      const matchClass = selectedClass === "Semua" || s.className === selectedClass;
      const matchQuery =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchQuery;
    });
  }

  if (!authenticated) {
    return (
      <div className="teacher-gate">
        <div className="gate-card">
          <div className="gate-icon">👑</div>
          <span className="eyebrow">Portal Guru ASJ</span>
          <h2>Akses Dashboard Guru</h2>
          <p>Masukkan PIN Guru untuk melihat rekap progres seluruh siswa SMKS Islam 1 Kota Blitar.</p>

          <form onSubmit={handleLogin} className="gate-form">
            {pinError && <div className="auth-alert error">⚠️ {pinError}</div>}
            <div className="form-group">
              <label>PIN Otorisasi Guru</label>
              <input
                type="password"
                placeholder="Masukkan PIN Rahasia Guru"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="primary-button" style={{ width: "100%", justifyContent: "center" }}>
              Buka Rekap Siswa →
            </button>
          </form>

          <button className="secondary-button" style={{ marginTop: "16px" }} onClick={onBack}>
            ← Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();
  const totalMod = modules.length;
  const isSupabaseActive = !!getSupabaseClient();

  // Completion calculation for daily assignment
  const targetCompletedCount = filteredStudents.filter((s) =>
    assignment.targetModules.every((m) => s.completedModules.includes(m))
  ).length;
  const targetCompletionPct =
    filteredStudents.length > 0
      ? Math.round((targetCompletedCount / filteredStudents.length) * 100)
      : 0;

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <div>
          <div className="teacher-title-row">
            <span className="eyebrow">Dashboard Administrasi</span>
            <span className={`cloud-badge ${isSupabaseActive ? "active" : "local"}`}>
              {isSupabaseActive ? "☁️ Supabase Cloud Aktif" : "💾 Mode Penyimpanan Lokal"}
            </span>
          </div>
          <h1>Portal Rekap Pembelajaran Guru</h1>
          <p>Guru Pembimbing: <strong>Wilda Ariffatul Faisalnur, S.Kom</strong></p>
        </div>
        <div className="teacher-header-actions">
          <button className="secondary-button" onClick={loadStudents} disabled={loadingRefresh}>
            {loadingRefresh ? "Memuat..." : "🔄 Refresh Data"}
          </button>
          <button className="primary-button" onClick={handleExport}>
            📥 Unduh Excel (CSV)
          </button>
          <button className="secondary-button" onClick={onBack}>
            ← Kembali ke Lab
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="teacher-metrics">
        <div className="metric-box">
          <strong>{students.length}</strong>
          <span>Total Siswa Terdaftar</span>
        </div>
        <div className="metric-box">
          <strong>
            {students.length > 0
              ? Math.round(students.reduce((acc, s) => acc + s.completedModules.length, 0) / students.length)
              : 0} / {totalMod}
          </strong>
          <span>Rata-rata Modul Selesai</span>
        </div>
        <div className="metric-box">
          <strong>
            {students.length > 0
              ? Math.round(students.reduce((acc, s) => acc + s.xp, 0) / students.length)
              : 0} XP
          </strong>
          <span>Rata-rata XP per Siswa</span>
        </div>
        <div className="metric-box">
          <strong>
            {students.reduce((acc, s) => acc + (s.totalTypedCommands || 0), 0)}
          </strong>
          <span>Total Script Berhasil Diketik</span>
        </div>
      </div>

      {/* Teacher Daily Assignment Manager */}
      <div className="teacher-settings-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3>🎯 Pengaturan Misi Praktik Hari Ini</h3>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
              Tentukan modul mana yang wajib diselesaikan siswa pada sesi lab hari ini.
            </p>
          </div>
          <div className="assignment-progress-stat">
            <span>Selesai Target Hari Ini ({selectedClass}):</span>
            <strong>{targetCompletedCount}/{filteredStudents.length} Siswa ({targetCompletionPct}%)</strong>
          </div>
        </div>

        {assignmentSavedMsg && <div className="auth-alert success" style={{ marginTop: "12px" }}>{assignmentSavedMsg}</div>}

        <form onSubmit={handleSaveAssignment} style={{ marginTop: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="form-group">
              <label>Judul Misi Tugas</label>
              <input
                type="text"
                value={assignment.title}
                onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Keterangan Instruksi</label>
              <input
                type="text"
                value={assignment.description}
                onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
                required
              />
            </div>
          </div>

          <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "8px" }}>
            Pilih Modul Target Praktik:
          </label>
          <div className="assignment-modules-picker">
            {modules.map((m) => {
              const isPicked = assignment.targetModules.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  className={`assign-mod-chip ${isPicked ? "picked" : ""}`}
                  onClick={() => toggleAssignmentModule(m.id)}
                >
                  <span>{isPicked ? "✓" : "+"}</span>
                  <span>{m.number}. {m.title}</span>
                </button>
              );
            })}
          </div>

          <button type="submit" className="primary-button" style={{ marginTop: "14px" }}>
            💾 Terapkan Tugas Praktik ke Siswa
          </button>
        </form>
      </div>

      {/* Filter and search */}
      <div className="teacher-controls">
        <div className="class-tabs">
          <button
            className={`class-tab ${selectedClass === "Semua" ? "active" : ""}`}
            onClick={() => setSelectedClass("Semua")}
          >
            Semua ({students.length})
          </button>
          {AVAILABLE_CLASSES.map((cls) => {
            const count = students.filter((s) => s.className === cls).length;
            return (
              <button
                key={cls}
                className={`class-tab ${selectedClass === cls ? "active" : ""}`}
                onClick={() => setSelectedClass(cls)}
              >
                {cls} ({count})
              </button>
            );
          })}
        </div>

        <div className="teacher-search">
          <input
            type="text"
            placeholder="Cari nama atau NISN siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="teacher-table-container">
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada data siswa pada filter ini.</p>
            <small>Siswa dapat mendaftar melalui tombol "Daftar Akun" di pojok kanan atas.</small>
          </div>
        ) : (
          <table className="teacher-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>NISN</th>
                <th>Kelas</th>
                <th>Progress Modul</th>
                <th>Kuis</th>
                <th>XP / Level</th>
                <th>Terakhir Aktif</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => {
                const modCount = s.completedModules.length;
                const pct = Math.round((modCount / totalMod) * 100);
                return (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <button className="student-name-link" onClick={() => setSelectedStudent(s)}>
                        <strong>{s.name}</strong>
                      </button>
                    </td>
                    <td><code>{s.nisn}</code></td>
                    <td><span className="badge-class-sm">{s.className}</span></td>
                    <td>
                      <div className="table-progress">
                        <div className="table-progress-bar">
                          <i style={{ width: `${pct}%` }} />
                        </div>
                        <span>{modCount}/{totalMod} ({pct}%)</span>
                      </div>
                    </td>
                    <td><span className="badge-quiz">{s.passedQuizzes.length} Lulus</span></td>
                    <td><strong>{s.xp} XP</strong> (Lv. {s.level})</td>
                    <td><small>{new Date(s.lastActive).toLocaleDateString("id-ID")}</small></td>
                    <td>
                      <div className="table-row-actions">
                        <button className="table-btn view" onClick={() => setSelectedStudent(s)}>Detail</button>
                        <button className="table-btn cert" onClick={() => onOpenCertificateForStudent(s)}>Sertifikat</button>
                        <button className="table-btn del" onClick={() => handleDeleteStudent(s.id, s.name)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div className="modal-dialog progress-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Rincian Belajar Siswa</span>
                <h2>{selectedStudent.name}</h2>
                <span className="badge-class">{selectedStudent.className} • NISN: {selectedStudent.nisn}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>×</button>
            </div>

            <div className="student-stats-overview">
              <div className="stat-card">
                <strong>{selectedStudent.completedModules.length}/{totalMod}</strong>
                <span>Modul Selesai</span>
              </div>
              <div className="stat-card">
                <strong>{selectedStudent.xp} XP</strong>
                <span>Level {selectedStudent.level}</span>
              </div>
              <div className="stat-card">
                <strong>{selectedStudent.passedQuizzes.length}</strong>
                <span>Kuis Lulus</span>
              </div>
              <div className="stat-card">
                <strong>{selectedStudent.totalTypedCommands || 0}</strong>
                <span>Perintah Diketik</span>
              </div>
            </div>

            <div className="module-checklist-summary">
              <h3>Status Modul ({selectedStudent.completedModules.length}/{totalMod})</h3>
              <div className="checklist-grid">
                {modules.map((m) => {
                  const isDone = selectedStudent.completedModules.includes(m.id);
                  const quizDone = selectedStudent.passedQuizzes.includes(m.id);
                  return (
                    <div key={m.id} className={`checklist-item ${isDone ? "done" : ""}`}>
                      <span className="check-icon">{isDone ? "✓" : "○"}</span>
                      <div className="check-info">
                        <strong>{m.number}. {m.title}</strong>
                        <small>{isDone ? "✅ Praktik Selesai" : "⏳ Belum Selesai"} • {quizDone ? "Kuis Lulus" : "Kuis Belum"}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions-footer">
              <button className="secondary-button" onClick={() => { const std = selectedStudent; setSelectedStudent(null); onOpenCertificateForStudent(std); }}>
                📜 Buka Sertifikat Siswa
              </button>
              <button className="primary-button" onClick={() => setSelectedStudent(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Cloud Status Section */}
      <div className="teacher-settings-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3>☁️ Database Supabase Cloud (Otomatis Terhubung)</h3>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
              Terkoneksi ke project <code>https://yxwcnqxqidnlidtddrve.supabase.co</code> pada tabel <code>asj_students</code>. Seluruh data siswa dan progress otomatis tersinkronisasi secara real-time.
            </p>
          </div>
          <span className="cloud-badge active" style={{ fontSize: "12px", padding: "6px 14px" }}>
            ✅ Cloud Supabase Aktif
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={loadStudents}
            disabled={loadingRefresh}
          >
            {loadingRefresh ? "Menyinkronkan..." : "🔄 Sinkronkan Ulang Data Cloud"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowSqlSchema(!showSqlSchema)}
          >
            📋 {showSqlSchema ? "Sembunyikan SQL Schema" : "Lihat SQL Schema"}
          </button>
        </div>

        {showSqlSchema && (
          <div className="sql-schema-box">
            <div className="sql-schema-header">
              <span>SQL Schema Tabel asj_students</span>
              <button className="copy-button" onClick={copySqlSchema}>
                {copiedSql ? "✓ Tersalin" : "Salin SQL"}
              </button>
            </div>
            <pre><code>{SUPABASE_SQL_SCHEMA}</code></pre>
          </div>
        )}
      </div>

      {/* Teacher Security PIN Section */}
      <div className="teacher-settings-card">
        <h3>🔐 Pengaturan Keamanan Guru</h3>
        <form onSubmit={handleChangePin} className="pin-change-form">
          {pinChangeMsg && <div className="auth-alert success">{pinChangeMsg}</div>}
          <div className="form-group-inline">
            <input
              type="password"
              placeholder="Ganti PIN Guru baru (min 4 digit)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
            <button type="submit" className="primary-button">Simpan PIN Baru</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* MAIN APP COMPONENT                                                        */
/* ========================================================================= */
export default function Home() {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [passedQuizzes, setPassedQuizzes] = useState<string[]>([]);
  const [streak, setStreak] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [menu, setMenu] = useState(false);

  // Theme & Sound state
  const [theme, setTheme] = useState<"light" | "dark" | "hacker">("light");
  const [soundMuted, setSoundMuted] = useState(false);

  // Modals state
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [studentProgressOpen, setStudentProgressOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [certificateStudent, setCertificateStudent] = useState<StudentProfile | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  // Daily assignment
  const [assignment, setAssignment] = useState<DailyAssignment>(getDailyAssignment());

  useEffect(() => {
    // Theme load
    const savedTheme = (localStorage.getItem("asj-theme") as any) || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Sound load
    const isMuted = localStorage.getItem("asj_sound_muted") === "true";
    setSoundMuted(isMuted);

    // Student session
    const currentStudent = getActiveStudent();
    if (currentStudent) {
      setStudent(currentStudent);
      setCompleted(currentStudent.completedModules);
      setCompletedSteps(currentStudent.completedSteps);
      setPassedQuizzes(currentStudent.passedQuizzes);
    } else {
      setCompleted(readStored("asj-progress", []));
      setCompletedSteps(readStored("asj-steps", []));
      setPassedQuizzes(readStored("asj-quizzes", []));
    }

    // Daily streak
    const today = localDate();
    const previous = readStored<{ last: string; count: number }>("asj-streak", { last: "", count: 0 });
    const yesterday = localDate(-1);
    const next = previous.last === today ? previous : { last: today, count: previous.last === yesterday ? previous.count + 1 : 1 };
    localStorage.setItem("asj-streak", JSON.stringify(next));
    setStreak(next.count);

    // Preload all students for leaderboard
    fetchAllStudentsUnified().then((data) => setAllStudents(data));

    // Shortcut Ctrl+K / Cmd+K listener
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "hacker" : "light";
    setTheme(next);
    localStorage.setItem("asj-theme", next);
    document.documentElement.setAttribute("data-theme", next);
    playSoundEffect("click");
  }

  function toggleSound() {
    const next = !soundMuted;
    setSoundMuted(next);
    localStorage.setItem("asj_sound_muted", String(next));
  }

  function saveList(setter: React.Dispatch<React.SetStateAction<string[]>>, key: string, update: (prev: string[]) => string[]) {
    setter((prev) => {
      const next = update(prev);
      localStorage.setItem(key, JSON.stringify(next));

      if (key === "asj-progress") {
        syncStudentProgressUnified(next, completedSteps, passedQuizzes);
      } else if (key === "asj-steps") {
        syncStudentProgressUnified(completed, next, passedQuizzes);
      } else if (key === "asj-quizzes") {
        syncStudentProgressUnified(completed, completedSteps, next);
      }

      const cur = getActiveStudent();
      if (cur) setStudent(cur);

      return next;
    });
  }

  function toggleDone(id: string) {
    saveList(setCompleted, "asj-progress", (prev) => {
      const adding = !prev.includes(id);
      if (adding) {
        playSoundEffect("levelup");
        setCelebrate(true);
        window.setTimeout(() => setCelebrate(false), 2400);
      }
      return adding ? [...prev, id] : prev.filter((x) => x !== id);
    });
  }

  function toggleStep(id: string, index: number) {
    const key = `${id}:${index}`;
    saveList(setCompletedSteps, "asj-steps", (prev) => {
      const adding = !prev.includes(key);
      if (adding) playSoundEffect("success");
      return adding ? [...prev, key] : prev.filter((x) => x !== key);
    });
  }

  function passQuiz(id: string) {
    saveList(setPassedQuizzes, "asj-quizzes", (prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }

  function handleCommandTyped() {
    syncStudentProgressUnified(completed, completedSteps, passedQuizzes, {}, 1);
    const cur = getActiveStudent();
    if (cur) setStudent(cur);
  }

  function handleAuthSuccess(loggedStudent: StudentProfile) {
    setStudent(loggedStudent);
    setCompleted(loggedStudent.completedModules);
    setCompletedSteps(loggedStudent.completedSteps);
    setPassedQuizzes(loggedStudent.passedQuizzes);
    setAuthModalOpen(false);
  }

  function handleLogout() {
    setActiveStudentSession(null);
    setStudent(null);
    setStudentProgressOpen(false);
  }

  function go(id: string) {
    setActive(id);
    setMenu(false);
    playSoundEffect("click");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filtered = useMemo(
    () => modules.filter((m) => `${m.title} ${m.summary} ${m.objectives.join(" ")}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const percent = Math.round((completed.length / modules.length) * 100);
  const xp = completed.length * 100 + completedSteps.length * 20 + passedQuizzes.length * 50;
  const level = Math.floor(xp / 250) + 1;
  const levelProgress = Math.round(((xp % 250) / 250) * 100);
  const resumeModule = modules.find((module) => !completed.includes(module.id)) ?? modules[0];
  const dailyModule = modules[Math.floor(Date.now() / 86400000) % modules.length];

  // Daily Assignment completed check
  const assignmentCompleted =
    assignment.active &&
    assignment.targetModules.length > 0 &&
    assignment.targetModules.every((m) => completed.includes(m));

  return (
    <div className={`app-shell theme-${theme}`}>
      {celebrate && (
        <div className="celebration" role="status" aria-live="polite">
          <div className="confetti">{Array.from({ length: 18 }).map((_, i) => <i key={i} />)}</div>
          <strong>Modul Selesai! +100 XP</strong>
          <span>Server berikutnya menunggu.</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">W</div>
          <div>
            <strong>Wilda Ariffatul Faisalnur, S.Kom</strong>
            <span>ASJ Learning Lab</span>
          </div>
          <button className="close-menu" onClick={() => setMenu(false)}>×</button>
        </div>

        {/* Student Session Card in Sidebar */}
        <div className="student-sidebar-badge">
          {student ? (
            <div className="logged-student-card" onClick={() => setStudentProgressOpen(true)}>
              <div className="student-avatar">{student.name.charAt(0).toUpperCase()}</div>
              <div className="student-text">
                <strong>{student.name}</strong>
                <span>{student.className} • Lv. {student.level}</span>
              </div>
            </div>
          ) : (
            <div className="guest-card">
              <span>Mode Tamu</span>
              <button
                className="guest-login-btn"
                onClick={() => { setAuthModalMode("login"); setAuthModalOpen(true); }}
              >
                Login / Daftar
              </button>
            </div>
          )}
        </div>

        <div className="progress-card">
          <div className="progress-copy">
            <span>Level {level} · {xp} XP</span>
            <strong>{percent}%</strong>
          </div>
          <div className="progress-track"><i style={{ width: `${percent}%` }} /></div>
          <small>🔥 {streak} hari belajar · {completed.length}/{modules.length} modul</small>
        </div>

        <nav aria-label="Navigasi modul">
          <button onClick={() => go("overview")} className={active === "overview" ? "active" : ""}>
            <span className="nav-icon">⌂</span>
            <span>Ringkasan Lab</span>
          </button>
          <button onClick={() => { setLeaderboardOpen(true); playSoundEffect("click"); }} className="leaderboard-nav-btn">
            <span className="nav-icon">🏆</span>
            <span>Leaderboard Siswa</span>
          </button>
          <button onClick={() => go("teacher")} className={`teacher-nav-btn ${active === "teacher" ? "active" : ""}`}>
            <span className="nav-icon">👑</span>
            <span>Portal Rekap Guru</span>
          </button>
          <p className="nav-label">Materi praktik</p>
          {modules.map((m) => (
            <button key={m.id} onClick={() => go(m.id)} className={active === m.id ? "active" : ""}>
              <span className="nav-icon"><Icon name={m.icon} size={19} /></span>
              <span>{m.title}</span>
              {completed.includes(m.id) && <b>✓</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span>NETWORK EXPLORER</span>
          <p>SMKS Islam 1 Kota Blitar</p>
        </div>
      </aside>

      {menu && <button className="overlay" onClick={() => setMenu(false)} aria-label="Tutup menu" />}

      {/* Main Container */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenu(true)} aria-label="Buka menu">☰</button>
          <div className="crumb">
            <span>Administrasi Sistem Jaringan</span>
            <b>/</b>
            <strong>
              {active === "overview"
                ? "Ringkasan"
                : active === "teacher"
                ? "Portal Guru"
                : modules.find((m) => m.id === active)?.title}
            </strong>
          </div>

          <div className="topbar-user-section">
            {/* Quick Search Shortcut Button */}
            <button
              className="topbar-search-trigger"
              onClick={() => { setQuickSearchOpen(true); playSoundEffect("click"); }}
              title="Cari Materi (Ctrl+K)"
            >
              <span>🔍</span>
              <kbd className="topbar-kbd">Ctrl+K</kbd>
            </button>

            {/* Sound Toggle */}
            <button
              className="topbar-icon-btn"
              onClick={toggleSound}
              title={soundMuted ? "Suara: Mati (Klik untuk Nyalakan)" : "Suara: Aktif"}
            >
              {soundMuted ? "🔇" : "🔊"}
            </button>

            {/* Theme Toggle Button */}
            <button
              className="topbar-theme-btn"
              onClick={toggleTheme}
              title="Ganti Tema (Terang / Gelap / Hacker)"
            >
              {theme === "light" ? "🌙 Gelap" : theme === "dark" ? "⚡ Hacker" : "☀️ Terang"}
            </button>

            {student ? (
              <div className="user-pill">
                <span className="user-name" onClick={() => setStudentProgressOpen(true)}>
                  👤 {student.name} <b className="pill-class">{student.className}</b>
                </span>
                <button className="topbar-btn-progress" onClick={() => setStudentProgressOpen(true)}>
                  📊 Rapor
                </button>
                <button
                  className="topbar-btn-cert"
                  onClick={() => { setCertificateStudent(student); setCertificateOpen(true); }}
                  title="Lihat Sertifikat"
                >
                  📜
                </button>
                <button className="topbar-btn-logout" onClick={handleLogout} title="Keluar">
                  🚪
                </button>
              </div>
            ) : (
              <div className="auth-buttons-group">
                <button
                  className="auth-topbar-btn login"
                  onClick={() => { setAuthModalMode("login"); setAuthModalOpen(true); }}
                >
                  Masuk
                </button>
                <button
                  className="auth-topbar-btn register"
                  onClick={() => { setAuthModalMode("register"); setAuthModalOpen(true); }}
                >
                  Daftar
                </button>
              </div>
            )}
            <button
              className={`portal-guru-badge ${active === "teacher" ? "active" : ""}`}
              onClick={() => go("teacher")}
            >
              👑 Portal Guru
            </button>
          </div>
        </header>

        {/* Content switch */}
        <div className="content">
          {active === "teacher" ? (
            <TeacherPortal
              onBack={() => go("overview")}
              onOpenCertificateForStudent={(s) => {
                setCertificateStudent(s);
                setCertificateOpen(true);
              }}
            />
          ) : active === "overview" ? (
            <>
              {/* Daily Assignment Banner */}
              {assignment.active && (
                <div className={`assignment-hero-card ${assignmentCompleted ? "completed" : ""}`}>
                  <div className="assignment-badge-tag">🎯 TUGAS PRAKTIK HARI INI</div>
                  <div className="assignment-card-content">
                    <div>
                      <h2>{assignment.title}</h2>
                      <p>{assignment.description}</p>
                      <div className="assignment-target-chips">
                        {assignment.targetModules.map((mId) => {
                          const mInfo = modules.find((m) => m.id === mId);
                          const isDone = completed.includes(mId);
                          return (
                            <button
                              key={mId}
                              className={`assign-chip-link ${isDone ? "done" : ""}`}
                              onClick={() => go(mId)}
                            >
                              <span>{isDone ? "✓ Selesai" : "⏳ Praktikkan"}</span>
                              <strong>{mInfo ? `${mInfo.number}. ${mInfo.title}` : mId}</strong>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="assignment-status-badge">
                      {assignmentCompleted ? (
                        <div className="assign-complete-box">
                          <span>🎉 Tuntas!</span>
                          <small>Semua target hari ini selesai</small>
                        </div>
                      ) : (
                        <div className="assign-pending-box">
                          <span>⏳ Target Praktik</span>
                          <small>Selesaikan modul di atas</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <section className="hero">
                <div className="hero-copy">
                  <span className="eyebrow">Kurikulum ASJ • Docker lab • CLI server</span>
                  <h1>Belajar ASJ mendalam<br /><em>dari konsep ke praktik.</em></h1>
                  <p>
                    Lab interaktif untuk ASJ XI-XII TKJ. Disusun oleh Wilda Ariffatul Faisalnur, S.Kom. Materi mencakup OS jaringan, DHCP, remote server, DNS, FTP, web, database, mail, proxy, control panel hosting, keamanan, dan troubleshooting.
                  </p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => go("persiapan")}>
                      Mulai praktik <span>→</span>
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => { setLeaderboardOpen(true); playSoundEffect("click"); }}
                    >
                      🏆 Lihat Leaderboard
                    </button>
                    <a className="secondary-button" href="#kurikulum">Lihat kurikulum</a>
                  </div>
                </div>
                <div className="terminal-card">
                  <div className="terminal-bar"><i /><i /><i /><span>client-asj — bash</span></div>
                  <pre><span className="prompt">siswa@client-asj:~$</span> docker ps{`\n`}<span className="muted">CONTAINER   SERVICE       STATUS</span>{`\n`}web-asj     apache        <span className="green">Up</span>{`\n`}dns-asj     bind9         <span className="green">Up</span>{`\n`}proxy-asj   squid         <span className="green">Up</span>{`\n\n`}<span className="prompt">siswa@client-asj:~$</span> curl web.sekolah.test{`\n`}<span className="cyan">&lt;h1&gt;Web Server ASJ XI TKJ&lt;/h1&gt;</span></pre>
                </div>
              </section>

              <section className="stats">
                <div><strong>{modules.length}</strong><span>Modul bertahap</span></div>
                <div><strong>XI-XII</strong><span>Alur silabus ASJ</span></div>
                <div><strong>CLI</strong><span>Mode server utama</span></div>
                <div><strong>1</strong><span>Jaringan terisolasi</span></div>
              </section>

              <section className="mission-grid">
                <div className="mission-card mission-main">
                  <div>
                    <span className="eyebrow">Lanjutkan petualangan</span>
                    <h2>{resumeModule.title}</h2>
                    <p>{completed.length === 0 ? "Mulai dari konsep Docker dan OS jaringan sebelum masuk layanan server." : "Progresmu tersimpan di profil akunmu. Lanjut tepat dari tempat terakhir."}</p>
                  </div>
                  <button className="primary-button" onClick={() => go(resumeModule.id)}>Buka modul <span>→</span></button>
                </div>
                <div className="mission-card daily-card">
                  <span className="mission-icon">⚡</span>
                  <div>
                    <span className="eyebrow">Misi hari ini</span>
                    <h3>Taklukkan {dailyModule.title}</h3>
                    <p>Selesaikan satu langkah dan raih minimal 20 XP.</p>
                  </div>
                  <button onClick={() => go(dailyModule.id)} aria-label={`Buka ${dailyModule.title}`}>→</button>
                </div>
                <div className="mission-card rank-card">
                  <div className="rank-ring" style={{ "--rank": `${levelProgress * 3.6}deg` } as React.CSSProperties}>
                    <span>{level}</span>
                  </div>
                  <div>
                    <span className="eyebrow">Level teknisi</span>
                    <h3>{xp < 500 ? "CLI Beginner" : xp < 1000 ? "Server Operator" : "Network Admin"}</h3>
                    <p>{250 - (xp % 250)} XP menuju level berikutnya</p>
                  </div>
                </div>
              </section>

              {/* Dynamic Interactive Topology */}
              <InteractiveTopology onSelectModule={(mId) => go(mId)} />

              <section className="module-list" id="kurikulum">
                <div className="section-intro">
                  <span className="eyebrow">Kurikulum mendalam</span>
                  <h2>Pilih modul pembelajaran</h2>
                </div>
                <div className="search">
                  <span>⌕</span>
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari DHCP, SSH, DNS, proxy... (atau tekan Ctrl+K)" />
                </div>
                <div className="cards">
                  {filtered.map((m) => (
                    <button className="module-card" key={m.id} onClick={() => go(m.id)}>
                      <div className="card-top">
                        <span className="card-icon"><Icon name={m.icon} /></span>
                        <span className="module-no">{m.number}</span>
                      </div>
                      <h3>{m.title}</h3>
                      <p>{m.summary}</p>
                      <div className="card-meta">
                        <span>{m.duration}</span>
                        <span>{m.level}</span>
                        {completed.includes(m.id) && <span className="complete">✓ Selesai</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="safety">
                <div>
                  <span className="eyebrow">Wajib dibaca</span>
                  <h2>Praktik aman sebelum jaringan nyata</h2>
                  <p>Docker Desktop di macOS dan Windows berjalan melalui VM/NAT. Materi DHCP, proxy, mail, dan DNS dibuat untuk jaringan lab terisolasi sebelum diterapkan pada server sekolah yang sebenarnya.</p>
                  <button className="secondary-button light" onClick={() => go("security-troubleshooting")}>
                    Buka keamanan →
                  </button>
                </div>
                <div className="safety-icon"><Icon name="shield" size={58} /></div>
              </section>
            </>
          ) : (
            <ModuleView
              key={active}
              module={modules.find((m) => m.id === active) ?? modules[0]}
              done={completed.includes(active)}
              stepDone={completedSteps}
              quizPassed={passedQuizzes.includes(active)}
              toggleDone={() => toggleDone(active)}
              toggleStep={(index) => toggleStep(active, index)}
              passQuiz={() => passQuiz(active)}
              onCommandTyped={handleCommandTyped}
            />
          )}
        </div>

        <footer>
          <span>Lab Debian Docker • ASJ XI-XII TKJ</span>
          <span>Wilda Ariffatul Faisalnur, S.Kom • SMKS Islam 1 Kota Blitar</span>
        </footer>
      </main>

      {/* Student Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Student Progress / Report Card Modal */}
      <StudentProgressModal
        student={student}
        isOpen={studentProgressOpen}
        onClose={() => setStudentProgressOpen(false)}
        onLogout={handleLogout}
        onOpenCertificate={() => {
          setCertificateStudent(student);
          setCertificateOpen(true);
        }}
      />

      {/* Digital Certificate Modal */}
      <CertificateModal
        student={certificateStudent}
        isOpen={certificateOpen}
        onClose={() => setCertificateOpen(false)}
      />

      {/* Class Leaderboard Modal */}
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        allStudents={allStudents}
      />

      {/* Quick Search Spotlight (Ctrl+K) */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        onSelectModule={(mId) => go(mId)}
      />
    </div>
  );
}

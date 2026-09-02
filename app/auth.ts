import {
  getSupabaseClient,
  supabaseRegister,
  supabaseLogin,
  supabaseUpdateProgress,
  supabaseFetchAllStudents,
  supabaseDeleteStudent,
} from "./supabase";

export type StudentProfile = {
  id: string;
  nisn: string;
  name: string;
  className: string;
  passwordHash: string;
  createdAt: string;
  lastActive: string;
  completedModules: string[];
  completedSteps: string[];
  passedQuizzes: string[];
  quizScores: Record<string, number>;
  xp: number;
  level: number;
  streak: number;
  totalTypedCommands: number;
};

export type TeacherConfig = {
  pinHash: string;
};

const STUDENTS_KEY = "asj_students_db";
const SESSION_KEY = "asj_active_session";
const TEACHER_CONFIG_KEY = "asj_teacher_config";
const TEACHER_ATTEMPTS_KEY = "asj_teacher_failed_attempts";

// Salt for client-side hashing
const HASH_SALT = "asj_sec_salt_2026_smk1_";

// Pre-computed SHA-256 hash for default initial PIN 'guru2026'
export const DEFAULT_TEACHER_PIN_HASH = "8f03c00c735d466986687002fa88390885145bcfbc323381a17fa2b67f13cfb4";

export const AVAILABLE_CLASSES = [
  "XI TKJ 1",
  "XI TKJ 2",
  "XI TKJ 3",
  "XII TKJ 1",
  "XII TKJ 2",
  "XII TKJ 3",
  "Lainnya / Guru",
];

// Sanitize user inputs to prevent XSS / HTML injection
export function sanitizeInput(str: string): string {
  return str
    .replace(/[<>]/g, "")
    .replace(/["']/g, "")
    .trim();
}

// Cryptographic SHA-256 Hashing with Salt
export async function hashPin(secret: string): Promise<string> {
  const salted = `${HASH_SALT}${secret.trim()}`;
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(salted);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback
    }
  }

  // Fallback bitwise hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return `fb_${Math.abs(hash).toString(16)}`;
}

export function getAllStudentsLocal(): StudentProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllStudentsLocal(students: StudentProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function getActiveStudent(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const activeId = localStorage.getItem(SESSION_KEY);
    if (!activeId) return null;
    const all = getAllStudentsLocal();
    return all.find((s) => s.id === activeId) || null;
  } catch {
    return null;
  }
}

export function setActiveStudentSession(studentId: string | null): void {
  if (typeof window === "undefined") return;
  if (studentId) {
    localStorage.setItem(SESSION_KEY, studentId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// Unified Register
export async function registerStudentUnified(
  name: string,
  nisn: string,
  className: string,
  pin: string
): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
  const cleanNisn = sanitizeInput(nisn);
  const cleanName = sanitizeInput(name);
  const cleanClass = sanitizeInput(className);

  if (!cleanName || !cleanNisn || !pin) {
    return { success: false, message: "Semua kolom wajib diisi!" };
  }

  if (cleanName.length < 2) {
    return { success: false, message: "Nama terlalu pendek (minimal 2 karakter)." };
  }

  if (pin.trim().length < 3) {
    return { success: false, message: "Password / PIN minimal 3 karakter." };
  }

  const hashedPassword = await hashPin(pin);

  let initialCompleted: string[] = [];
  let initialSteps: string[] = [];
  let initialQuizzes: string[] = [];
  try {
    const savedMod = localStorage.getItem("asj-progress");
    if (savedMod) initialCompleted = JSON.parse(savedMod);
    const savedSteps = localStorage.getItem("asj-steps");
    if (savedSteps) initialSteps = JSON.parse(savedSteps);
    const savedQ = localStorage.getItem("asj-quizzes");
    if (savedQ) initialQuizzes = JSON.parse(savedQ);
  } catch {}

  const xp = initialCompleted.length * 100 + initialSteps.length * 20 + initialQuizzes.length * 50;
  const level = Math.floor(xp / 250) + 1;

  const newStudent: StudentProfile = {
    id: `std_${cleanNisn.replace(/\s+/g, "_")}`,
    nisn: cleanNisn,
    name: cleanName,
    className: cleanClass || "XI TKJ 1",
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    completedModules: initialCompleted,
    completedSteps: initialSteps,
    passedQuizzes: initialQuizzes,
    quizScores: {},
    xp,
    level,
    streak: 1,
    totalTypedCommands: 0,
  };

  // Check Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    const cloudRes = await supabaseRegister(cleanName, cleanNisn, cleanClass, pin, {
      completedModules: initialCompleted,
      completedSteps: initialSteps,
      passedQuizzes: initialQuizzes,
    });
    if (!cloudRes.success) return cloudRes;

    const student = cloudRes.student!;
    const all = getAllStudentsLocal();
    const idx = all.findIndex((s) => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
    if (idx >= 0) all[idx] = student;
    else all.push(student);
    saveAllStudentsLocal(all);
    setActiveStudentSession(student.id);

    return { success: true, message: "Pendaftaran berhasil & data terenkripsi aman di Cloud!", student };
  }

  // Local fallback
  const all = getAllStudentsLocal();
  const existing = all.find((s) => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
  if (existing) {
    return { success: false, message: `NISN "${cleanNisn}" sudah terdaftar atas nama ${existing.name}. Silakan masuk.` };
  }

  all.push(newStudent);
  saveAllStudentsLocal(all);
  setActiveStudentSession(newStudent.id);

  return { success: true, message: "Pendaftaran berhasil & password terenkripsi!", student: newStudent };
}

// Unified Login
export async function loginStudentUnified(
  nisn: string,
  pin: string
): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
  const cleanNisn = sanitizeInput(nisn);
  const hashed = await hashPin(pin);

  // Try Supabase first if configured
  const client = getSupabaseClient();
  if (client) {
    const cloudRes = await supabaseLogin(cleanNisn, pin);
    if (cloudRes.success && cloudRes.student) {
      const student = cloudRes.student;
      const all = getAllStudentsLocal();
      const idx = all.findIndex((s) => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
      if (idx >= 0) all[idx] = student;
      else all.push(student);
      saveAllStudentsLocal(all);
      setActiveStudentSession(student.id);

      try {
        localStorage.setItem("asj-progress", JSON.stringify(student.completedModules));
        localStorage.setItem("asj-steps", JSON.stringify(student.completedSteps));
        localStorage.setItem("asj-quizzes", JSON.stringify(student.passedQuizzes));
      } catch {}

      return cloudRes;
    } else if (cloudRes.message !== "Cloud database belum dikonfigurasi.") {
      return cloudRes;
    }
  }

  // Local fallback
  const all = getAllStudentsLocal();
  const student = all.find((s) => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
  if (!student) {
    return { success: false, message: "NISN / ID siswa tidak ditemukan. Silakan daftar terlebih dahulu." };
  }

  if (student.passwordHash !== hashed) {
    return { success: false, message: "Password / PIN salah. Silakan coba lagi." };
  }

  student.lastActive = new Date().toISOString();
  saveAllStudentsLocal(all);
  setActiveStudentSession(student.id);

  try {
    localStorage.setItem("asj-progress", JSON.stringify(student.completedModules));
    localStorage.setItem("asj-steps", JSON.stringify(student.completedSteps));
    localStorage.setItem("asj-quizzes", JSON.stringify(student.passedQuizzes));
  } catch {}

  return { success: true, message: `Selamat datang kembali, ${student.name}!`, student };
}

// Unified Progress Sync
export function syncStudentProgressUnified(
  completedModules: string[],
  completedSteps: string[],
  passedQuizzes: string[],
  quizScores: Record<string, number> = {},
  incrementTyped = 0
): void {
  const active = getActiveStudent();
  if (!active) return;

  const all = getAllStudentsLocal();
  const idx = all.findIndex((s) => s.id === active.id);
  if (idx === -1) return;

  const xp = completedModules.length * 100 + completedSteps.length * 20 + passedQuizzes.length * 50;
  const level = Math.floor(xp / 250) + 1;

  all[idx].completedModules = completedModules;
  all[idx].completedSteps = completedSteps;
  all[idx].passedQuizzes = passedQuizzes;
  all[idx].quizScores = { ...all[idx].quizScores, ...quizScores };
  all[idx].xp = xp;
  all[idx].level = level;
  all[idx].lastActive = new Date().toISOString();
  if (incrementTyped > 0) {
    all[idx].totalTypedCommands = (all[idx].totalTypedCommands || 0) + incrementTyped;
  }

  saveAllStudentsLocal(all);
  supabaseUpdateProgress(all[idx]);
}

// Fetch all students (Supabase if connected, else Local)
export async function fetchAllStudentsUnified(): Promise<StudentProfile[]> {
  const client = getSupabaseClient();
  if (client) {
    const cloudStudents = await supabaseFetchAllStudents();
    if (cloudStudents.length > 0) {
      saveAllStudentsLocal(cloudStudents);
      return cloudStudents;
    }
  }
  return getAllStudentsLocal();
}

// Delete student
export async function deleteStudentUnified(id: string): Promise<void> {
  const all = getAllStudentsLocal().filter((s) => s.id !== id);
  saveAllStudentsLocal(all);
  await supabaseDeleteStudent(id);
}

/* ========================================================================= */
/* TEACHER AUTHENTICATION & BRUTE-FORCE PROTECTION                           */
/* ========================================================================= */
export function getTeacherConfig(): TeacherConfig {
  if (typeof window === "undefined") return { pinHash: DEFAULT_TEACHER_PIN_HASH };
  try {
    const raw = localStorage.getItem(TEACHER_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { pinHash: DEFAULT_TEACHER_PIN_HASH };
  } catch {
    return { pinHash: DEFAULT_TEACHER_PIN_HASH };
  }
}

export function saveTeacherConfig(config: TeacherConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEACHER_CONFIG_KEY, JSON.stringify(config));
}

// Check if teacher login is currently locked due to too many attempts
export function checkTeacherLockout(): { locked: boolean; remainingSeconds: number } {
  if (typeof window === "undefined") return { locked: false, remainingSeconds: 0 };
  try {
    const raw = sessionStorage.getItem(TEACHER_ATTEMPTS_KEY);
    if (!raw) return { locked: false, remainingSeconds: 0 };
    const { count, lockUntil } = JSON.parse(raw);
    const now = Date.now();
    if (lockUntil && now < lockUntil) {
      return { locked: true, remainingSeconds: Math.ceil((lockUntil - now) / 1000) };
    }
    return { locked: false, remainingSeconds: 0 };
  } catch {
    return { locked: false, remainingSeconds: 0 };
  }
}

export function recordFailedTeacherAttempt(): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
  if (typeof window === "undefined") return { locked: false, remainingSeconds: 0, attemptsLeft: 5 };
  try {
    const raw = sessionStorage.getItem(TEACHER_ATTEMPTS_KEY);
    let attempts = raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 };
    attempts.count += 1;

    if (attempts.count >= 5) {
      // Lock for 10 minutes (600 seconds)
      attempts.lockUntil = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem(TEACHER_ATTEMPTS_KEY, JSON.stringify(attempts));
      return { locked: true, remainingSeconds: 600, attemptsLeft: 0 };
    }

    sessionStorage.setItem(TEACHER_ATTEMPTS_KEY, JSON.stringify(attempts));
    return { locked: false, remainingSeconds: 0, attemptsLeft: 5 - attempts.count };
  } catch {
    return { locked: false, remainingSeconds: 0, attemptsLeft: 4 };
  }
}

export function clearTeacherAttempts(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TEACHER_ATTEMPTS_KEY);
}

export async function verifyTeacherPinSecure(inputPin: string): Promise<boolean> {
  const lockout = checkTeacherLockout();
  if (lockout.locked) return false;

  const config = getTeacherConfig();
  const hashedInput = await hashPin(inputPin);

  const isValid = hashedInput === config.pinHash;
  if (isValid) {
    clearTeacherAttempts();
  } else {
    recordFailedTeacherAttempt();
  }
  return isValid;
}

export async function updateTeacherPinSecure(newPin: string): Promise<boolean> {
  if (newPin.trim().length < 4) return false;
  const pinHash = await hashPin(newPin);
  saveTeacherConfig({ pinHash });
  return true;
}

// Export students to CSV (with strict privacy - NO password hashes)
export function exportStudentsToCSV(students: StudentProfile[]): string {
  const headers = [
    "No",
    "NISN / ID",
    "Nama Siswa",
    "Kelas",
    "Modul Selesai",
    "Jumlah Langkah Selesai",
    "Kuis Lulus",
    "Total XP",
    "Level",
    "Total Perintah Diketik",
    "Terakhir Aktif",
    "Tanggal Pendaftaran",
  ];

  const rows = students.map((s, i) => [
    i + 1,
    `"${s.nisn}"`,
    `"${s.name}"`,
    `"${s.className}"`,
    s.completedModules.length,
    s.completedSteps.length,
    s.passedQuizzes.length,
    s.xp,
    s.level,
    s.totalTypedCommands || 0,
    `"${new Date(s.lastActive).toLocaleString("id-ID")}"`,
    `"${new Date(s.createdAt).toLocaleDateString("id-ID")}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

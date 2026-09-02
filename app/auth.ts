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
  pin: string;
};

const STUDENTS_KEY = "asj_students_db";
const SESSION_KEY = "asj_active_session";
const TEACHER_CONFIG_KEY = "asj_teacher_config";

export const DEFAULT_TEACHER_PIN = "guru2026";

export const AVAILABLE_CLASSES = [
  "XI TKJ 1",
  "XI TKJ 2",
  "XI TKJ 3",
  "XII TKJ 1",
  "XII TKJ 2",
  "XII TKJ 3",
  "Lainnya / Guru",
];

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

export function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

// Unified Register (Supabase Cloud + Local Backup)
export async function registerStudentUnified(
  name: string,
  nisn: string,
  className: string,
  pin: string
): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
  const cleanNisn = nisn.trim();
  const cleanName = name.trim();

  if (!cleanName || !cleanNisn || !pin) {
    return { success: false, message: "Semua kolom wajib diisi!" };
  }

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

  // Check Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    const cloudRes = await supabaseRegister(cleanName, cleanNisn, className, pin, {
      completedModules: initialCompleted,
      completedSteps: initialSteps,
      passedQuizzes: initialQuizzes,
    });
    if (!cloudRes.success) return cloudRes;

    const student = cloudRes.student!;
    // Save to local list
    const all = getAllStudentsLocal();
    const idx = all.findIndex((s) => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
    if (idx >= 0) all[idx] = student;
    else all.push(student);
    saveAllStudentsLocal(all);
    setActiveStudentSession(student.id);

    return { success: true, message: "Pendaftaran berhasil! Akun tersinkron ke Supabase Cloud ☁️", student };
  }

  // Fallback purely local
  const all = getAllStudentsLocal();
  const existing = all.find((s) => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
  if (existing) {
    return { success: false, message: `NISN "${cleanNisn}" sudah terdaftar atas nama ${existing.name}. Silakan login.` };
  }

  const xp = initialCompleted.length * 100 + initialSteps.length * 20 + initialQuizzes.length * 50;
  const level = Math.floor(xp / 250) + 1;

  const newStudent: StudentProfile = {
    id: `std_${cleanNisn.replace(/\s+/g, "_")}`,
    nisn: cleanNisn,
    name: cleanName,
    className: className || "XI TKJ 1",
    passwordHash: hashPin(pin),
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

  all.push(newStudent);
  saveAllStudentsLocal(all);
  setActiveStudentSession(newStudent.id);

  return { success: true, message: "Pendaftaran berhasil di perangkat ini!", student: newStudent };
}

// Unified Login (Supabase Cloud + Local Backup)
export async function loginStudentUnified(
  nisn: string,
  pin: string
): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
  const cleanNisn = nisn.trim();

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

      // Restore progress to localStorage
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

  if (student.passwordHash !== hashPin(pin)) {
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

  // Background sync to Supabase
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

// Teacher Config & Authentication
export function getTeacherConfig(): TeacherConfig {
  if (typeof window === "undefined") return { pin: DEFAULT_TEACHER_PIN };
  try {
    const raw = localStorage.getItem(TEACHER_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { pin: DEFAULT_TEACHER_PIN };
  } catch {
    return { pin: DEFAULT_TEACHER_PIN };
  }
}

export function saveTeacherConfig(config: TeacherConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEACHER_CONFIG_KEY, JSON.stringify(config));
}

export function verifyTeacherPin(inputPin: string): boolean {
  const config = getTeacherConfig();
  return inputPin.trim() === config.pin.trim();
}

// Export students to CSV
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

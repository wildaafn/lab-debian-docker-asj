import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type StudentProfile, hashPin } from "./auth";

const SUPABASE_CONFIG_KEY = "asj_supabase_custom_config";
export const ASJ_STUDENTS_TABLE = "asj_students";

export const DEFAULT_SUPABASE_URL = "https://yxwcnqxqidnlidtddrve.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4d2NucXhxaWRubGlkdGRkcnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTQ1NDIsImV4cCI6MjEwMzE3MDU0Mn0.Lp7edVwLZWRirE-x1lTsLKQXKRJvOE1i2a-DoZW9kjw";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

// Default configuration with auto-configured Supabase
export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) return parsed;
      }
    } catch {}
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return null;

  const key = `${cfg.url}:${cfg.anonKey}`;
  if (supabaseInstance && currentConfigKey === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(cfg.url, cfg.anonKey);
    currentConfigKey = key;
    return supabaseInstance;
  } catch (e) {
    console.error("Failed to initialize Supabase client", e);
    return null;
  }
}

/* ========================================================================= */
/* SUPABASE SQL SCHEMA SCRIPT (DEDICATED ASJ TABLE: asj_students)            */
/* ========================================================================= */
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- TABEL KHUSUS APLIKASI LAB ASJ (TERISOLASI DARI NETDEFENDER)
-- Nama Tabel: asj_students
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.asj_students (
  id TEXT PRIMARY KEY,
  nisn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  completed_modules JSONB DEFAULT '[]'::jsonb,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  passed_quizzes JSONB DEFAULT '[]'::jsonb,
  quiz_scores JSONB DEFAULT '{}'::jsonb,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 1,
  total_typed_commands INTEGER DEFAULT 0
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.asj_students ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik Terpisah untuk Lab ASJ
DROP POLICY IF EXISTS "asj_students_public_access" ON public.asj_students;
CREATE POLICY "asj_students_public_access" ON public.asj_students
  FOR ALL
  USING (true)
  WITH CHECK (true);
`;

/* ========================================================================= */
/* DATABASE OPERATIONS (Using asj_students)                                  */
/* ========================================================================= */

// Register student in Supabase asj_students
export async function supabaseRegister(
  name: string,
  nisn: string,
  className: string,
  pin: string,
  initialData?: {
    completedModules: string[];
    completedSteps: string[];
    passedQuizzes: string[];
  }
): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
  const client = getSupabaseClient();
  const cleanNisn = nisn.trim();
  const cleanName = name.trim();
  const hashedPassword = await hashPin(pin);

  const newStudent: StudentProfile = {
    id: `std_${cleanNisn.replace(/\s+/g, "_")}`,
    nisn: cleanNisn,
    name: cleanName,
    className: className || "XI TKJ 1",
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    completedModules: initialData?.completedModules || [],
    completedSteps: initialData?.completedSteps || [],
    passedQuizzes: initialData?.passedQuizzes || [],
    quizScores: {},
    xp:
      (initialData?.completedModules.length || 0) * 100 +
      (initialData?.completedSteps.length || 0) * 20 +
      (initialData?.passedQuizzes.length || 0) * 50,
    level:
      Math.floor(
        ((initialData?.completedModules.length || 0) * 100 +
          (initialData?.completedSteps.length || 0) * 20 +
          (initialData?.passedQuizzes.length || 0) * 50) /
          250
      ) + 1,
    streak: 1,
    totalTypedCommands: 0,
  };

  if (!client) {
    return {
      success: true,
      message: "Akun disimpan secara lokal.",
      student: newStudent,
    };
  }

  try {
    const { data: existing, error: selectErr } = await client
      .from(ASJ_STUDENTS_TABLE)
      .select("id, name, nisn")
      .eq("nisn", cleanNisn)
      .maybeSingle();

    if (selectErr) {
      if (selectErr.message.includes("relation") || selectErr.message.includes("does not exist")) {
        return {
          success: false,
          message: "Tabel 'asj_students' belum dibuat di Supabase. Silakan buka Portal Guru dan jalankan SQL Schema.",
        };
      }
      throw selectErr;
    }

    if (existing) {
      return {
        success: false,
        message: `NISN "${cleanNisn}" sudah terdaftar atas nama ${existing.name}. Silakan masuk.`,
      };
    }

    const { error } = await client.from(ASJ_STUDENTS_TABLE).insert({
      id: newStudent.id,
      nisn: newStudent.nisn,
      name: newStudent.name,
      class_name: newStudent.className,
      password_hash: newStudent.passwordHash,
      created_at: newStudent.createdAt,
      last_active: newStudent.lastActive,
      completed_modules: newStudent.completedModules,
      completed_steps: newStudent.completedSteps,
      passed_quizzes: newStudent.passedQuizzes,
      quiz_scores: newStudent.quizScores,
      xp: newStudent.xp,
      level: newStudent.level,
      streak: newStudent.streak,
      total_typed_commands: newStudent.totalTypedCommands,
    });

    if (error) throw error;

    return { success: true, message: "Pendaftaran berhasil di Supabase Cloud (asj_students)!", student: newStudent };
  } catch (err: any) {
    console.error("Supabase Register error:", err);
    return { success: false, message: err.message || "Gagal mendaftar ke cloud database." };
  }
}

// Login student from Supabase asj_students
export async function supabaseLogin(
  nisn: string,
  pin: string
): Promise<{ success: boolean; message: string; student?: StudentProfile }> {
  const client = getSupabaseClient();
  const cleanNisn = nisn.trim();
  const hashed = await hashPin(pin);

  if (!client) {
    return { success: false, message: "Cloud database belum dikonfigurasi." };
  }

  try {
    const { data, error } = await client
      .from(ASJ_STUDENTS_TABLE)
      .select("*")
      .eq("nisn", cleanNisn)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { success: false, message: "NISN / ID tidak ditemukan di asj_students." };
    }

    if (data.password_hash !== hashed) {
      return { success: false, message: "Password / PIN salah." };
    }

    // Update last active
    await client
      .from(ASJ_STUDENTS_TABLE)
      .update({ last_active: new Date().toISOString() })
      .eq("id", data.id);

    const student: StudentProfile = {
      id: data.id,
      nisn: data.nisn,
      name: data.name,
      className: data.class_name,
      passwordHash: data.password_hash,
      createdAt: data.created_at,
      lastActive: new Date().toISOString(),
      completedModules: data.completed_modules || [],
      completedSteps: data.completed_steps || [],
      passedQuizzes: data.passed_quizzes || [],
      quizScores: data.quiz_scores || {},
      xp: data.xp || 0,
      level: data.level || 1,
      streak: data.streak || 1,
      totalTypedCommands: data.total_typed_commands || 0,
    };

    return { success: true, message: `Selamat datang, ${student.name}!`, student };
  } catch (err: any) {
    console.error("Supabase login error:", err);
    return { success: false, message: err.message || "Gagal masuk ke Supabase." };
  }
}

// Sync progress to Supabase asj_students
export async function supabaseUpdateProgress(student: StudentProfile): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !student.id) return false;

  try {
    const { error } = await client
      .from(ASJ_STUDENTS_TABLE)
      .update({
        last_active: new Date().toISOString(),
        completed_modules: student.completedModules,
        completed_steps: student.completedSteps,
        passed_quizzes: student.passedQuizzes,
        quiz_scores: student.quizScores,
        xp: student.xp,
        level: student.level,
        total_typed_commands: student.totalTypedCommands,
      })
      .eq("id", student.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase sync progress error:", err);
    return false;
  }
}

// Fetch all students for Teacher Dashboard from asj_students
export async function supabaseFetchAllStudents(): Promise<StudentProfile[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from(ASJ_STUDENTS_TABLE)
      .select("*")
      .order("last_active", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((d) => ({
      id: d.id,
      nisn: d.nisn,
      name: d.name,
      className: d.class_name,
      passwordHash: d.password_hash,
      createdAt: d.created_at,
      lastActive: d.last_active,
      completedModules: d.completed_modules || [],
      completedSteps: d.completed_steps || [],
      passedQuizzes: d.passed_quizzes || [],
      quizScores: d.quiz_scores || {},
      xp: d.xp || 0,
      level: d.level || 1,
      streak: d.streak || 1,
      totalTypedCommands: d.total_typed_commands || 0,
    }));
  } catch (err) {
    console.error("Fetch all students error:", err);
    return [];
  }
}

// Delete student from Supabase asj_students
export async function supabaseDeleteStudent(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from(ASJ_STUDENTS_TABLE).delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

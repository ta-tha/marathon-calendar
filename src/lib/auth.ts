import { createHmac } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "fallback-dev-secret";
const COOKIE_NAME = "admin_session";
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24시간

// 로그인 시도 횟수 제한 (메모리 기반, 서버리스 인스턴스별)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1분

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

export function createSessionToken(): string {
  const expires = Date.now() + TOKEN_EXPIRY;
  const payload = `admin:${expires}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [role, expiresStr, sig] = parts;
  const payload = `${role}:${expiresStr}`;
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expected) return false;
  if (Date.now() > Number(expiresStr)) return false;
  return true;
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

// Utility functions for consistent date parsing and formatting across the app
// Format: YYYY-MM-DD
// Parsing: robustly handles strings like "YYYY-MM-DD HH:mm[:ss]", "YYYY/MM/DD", ISO strings, and falls back to Date.parse

import type { DateRange } from "react-day-picker";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatYYYYMMDD(input?: string | Date | null): string {
  if (!input) return "-";
  const d = input instanceof Date ? (isNaN(input.getTime()) ? null : input) : parseDateFlexible(input);
  if (!d) return "-";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateFlexible(input: string | Date): Date | null {
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  const s = (input || "").trim();
  // Match: YYYY-MM-DD HH:mm[:ss] or YYYY/MM/DD HH:mm[:ss] or just date part
  const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const hh = m[4] ? Number(m[4]) : 0;
    const mm = m[5] ? Number(m[5]) : 0;
    const ss = m[6] ? Number(m[6]) : 0;
    const date = new Date(y, mo, d, hh, mm, ss, 0);
    return isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toEndOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function isDateWithinRange(input: string | Date, range: DateRange | null): boolean {
  if (!range) return true;
  const raw = input instanceof Date ? input : parseDateFlexible(input);
  if (!raw) return false;
  const dateOnly = toDateOnly(raw);
  const start = range.from ? toDateOnly(range.from) : null;
  const end = range.to ? toEndOfDay(range.to) : null;
  let ok = true;
  if (start) ok = ok && dateOnly >= start;
  if (end) ok = ok && dateOnly <= end;
  return ok;
}
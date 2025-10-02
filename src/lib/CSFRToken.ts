// src/lib/csrf.ts
export function getCSRFToken(): string | null {
    if (typeof document === "undefined") return null // SSR-safe
    const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
    return m ? decodeURIComponent(m[1]) : null
  }
  
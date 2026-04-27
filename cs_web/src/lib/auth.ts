"use client";

export type StoredUser = {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  steam_id?: string;
  has_premium?: boolean;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("cs2_token");
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("cs2_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return { id: 0, username: raw, email: "" };
  }
}

export function storeAuth(token: string, user: StoredUser) {
  window.localStorage.setItem("cs2_token", token);
  window.localStorage.setItem("cs2_user", JSON.stringify(user));
}

export function clearAuth() {
  window.localStorage.removeItem("cs2_token");
  window.localStorage.removeItem("cs2_user");
}

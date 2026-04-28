"use client";

export type StoredUser = {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  steam_id?: string;
  steam_persona_name?: string;
  steam_profile?: {
    steam_id?: string;
    openid_claimed_id?: string;
    openid_identity?: string;
    persona_name?: string;
    profile_url?: string;
    avatar?: string;
    avatar_medium?: string;
    avatar_full?: string;
    community_visibility_state?: number | null;
    profile_state?: number | null;
    persona_state?: number | null;
    last_logoff?: string | null;
    comment_permission?: number | null;
    real_name?: string;
    primary_clan_id?: string;
    time_created?: string | null;
    persona_state_flags?: number | null;
    loc_country_code?: string;
    loc_state_code?: string;
    loc_city_id?: number | null;
    profile_raw?: Record<string, unknown>;
    profile_synced_at?: string | null;
  };
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

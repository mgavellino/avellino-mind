// Spotify Authorization Code with PKCE — pure client flow, no secret needed.
const TOKEN_KEY = "spotify_token";
const REFRESH_KEY = "spotify_refresh";
const EXPIRES_KEY = "spotify_expires_at";
const VERIFIER_KEY = "spotify_pkce_verifier";
const CLIENT_ID_KEY = "spotify_client_id";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-top-read",
].join(" ");

export const getClientId = () =>
  (typeof window !== "undefined" && localStorage.getItem(CLIENT_ID_KEY)) || "";

export const setClientId = (id: string) => localStorage.setItem(CLIENT_ID_KEY, id.trim());

export const getRedirectUri = () =>
  typeof window !== "undefined" ? `${window.location.origin}/app/musica` : "";

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function sha256(text: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

function randomString(length = 64) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}

export async function beginLogin() {
  const clientId = getClientId();
  if (!clientId) throw new Error("Configure o Spotify Client ID primeiro.");
  const verifier = randomString(64);
  const challenge = b64url(await sha256(verifier));
  localStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  const clientId = getClientId();
  if (!verifier || !clientId) throw new Error("PKCE verifier ausente");
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error("Falha ao trocar code por token");
  const j = await r.json();
  storeToken(j);
  localStorage.removeItem(VERIFIER_KEY);
}

function storeToken(j: { access_token: string; refresh_token?: string; expires_in: number }) {
  localStorage.setItem(TOKEN_KEY, j.access_token);
  if (j.refresh_token) localStorage.setItem(REFRESH_KEY, j.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + (j.expires_in - 60) * 1000));
}

export async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(EXPIRES_KEY) || 0);
  if (token && Date.now() < exp) return token;
  return refresh();
}

export async function refresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const clientId = getClientId();
  if (!refreshToken || !clientId) return null;
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  storeToken(j);
  return j.access_token;
}

export function logout() {
  [TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY, VERIFIER_KEY].forEach((k) => localStorage.removeItem(k));
}

export const isLoggedIn = () => Boolean(localStorage.getItem(TOKEN_KEY));

export async function spotifyFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Não autenticado");
  const r = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (r.status === 204) return null;
  if (!r.ok) throw new Error(`Spotify ${r.status}`);
  return r.json();
}

const TOKEN_KEY = "jwt_token";
const WALLET_KEY = "walletAddress";
const USERNAME_KEY = "username";

export const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
};

export const getStoredUsername = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USERNAME_KEY) ?? "";
};

export const setStoredToken = (token: string) => {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const setStoredUsername = (username: string) => {
  if (typeof window === "undefined") return;
  if (username) {
    window.localStorage.setItem(USERNAME_KEY, username);
  } else {
    window.localStorage.removeItem(USERNAME_KEY);
  }
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(WALLET_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
};

export const getJwtFromUrl = () => {
  if (typeof window === "undefined") return "";
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
  return queryParams.get("jwt") || hashParams.get("jwt") || "";
};

export const clearJwtFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("jwt")) {
    url.searchParams.delete("jwt");
    window.history.replaceState({}, "", url.toString());
  }
  if (url.hash.includes("jwt=")) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#\/?/, ""));
    if (hashParams.has("jwt")) {
      hashParams.delete("jwt");
      const cleaned = hashParams.toString();
      url.hash = cleaned ? `#/${cleaned}` : "";
      window.history.replaceState({}, "", url.toString());
    }
  }
};

export const getSourceFromUrl = () => {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("source") ?? "";
};

export const clearSourceFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("source")) {
    url.searchParams.delete("source");
    window.history.replaceState({}, "", url.toString());
  }
};

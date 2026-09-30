const authTokenKey = "dhaka_tesla_pool_access_token";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function setToken(token: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(authTokenKey, token);
}

export function getToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  return window.localStorage.getItem(authTokenKey);
}

export function removeToken(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(authTokenKey);
}

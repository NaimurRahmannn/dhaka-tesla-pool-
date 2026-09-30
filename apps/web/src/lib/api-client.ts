export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  accessToken?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

function buildApiUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const responseBody = await parseResponse(response);

  if (!response.ok) {
    throw new ApiClientError(
      `API request failed with status ${response.status}`,
      response.status,
      responseBody,
    );
  }

  return responseBody as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method">) =>
    apiRequest<TResponse>(path, { ...options, method: "GET" }),
  post: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiRequest<TResponse>(path, { ...options, method: "POST", body }),
  patch: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => apiRequest<TResponse>(path, { ...options, method: "PATCH", body }),
  delete: <TResponse>(
    path: string,
    options?: Omit<ApiRequestOptions, "method">,
  ) => apiRequest<TResponse>(path, { ...options, method: "DELETE" }),
};

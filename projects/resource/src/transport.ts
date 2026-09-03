export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface TransportRequest {
  method: HttpMethod;
  /** The absolute URL, query string included. */
  url: string;
  /** A JSON-serializable body, or undefined for none. */
  body?: unknown;
}

export interface TransportResponse {
  status: number;
  /** The decoded JSON body; undefined for an empty body. */
  body: unknown;
}

/**
 * Transport carries one request to the server. It resolves for every HTTP status —
 * the client turns 4xx/5xx into ApiError — and rejects only when no response could
 * be obtained at all. Swap it to route requests through a framework HTTP stack
 * (interceptors, loading indicators, auth redirects) without touching the client.
 */
export type Transport = (request: TransportRequest) => Promise<TransportResponse>;

/** A non-2xx response, carrying the server's decoded body. */
export class ApiError extends Error {
  constructor(
    readonly method: HttpMethod,
    readonly url: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(messageOf(body, status));
    this.name = 'ApiError';
  }
}

function messageOf(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }
  if (typeof body === 'string' && body !== '') {
    return body;
  }
  return `HTTP ${status}`;
}

/**
 * The cookie-to-header XSRF handshake the generated server enforces on mutating
 * requests: the token cookie's value is echoed in a request header. The defaults are
 * the server's; pass `false` to disable (a service account outlet, or a non-browser
 * runtime that manages cookies itself).
 */
export interface XsrfOptions {
  cookieName: string;
  headerName: string;
}

export const defaultXsrf: XsrfOptions = { cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' };

export interface FetchTransportOptions {
  /** The fetch implementation; defaults to the global one. */
  fetch?: typeof fetch;
  /** Defaults to `same-origin`, which sends the session cookie to the API host that set it. */
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
  /** XSRF cookie-to-header echo for non-GET requests, when a document is available. Defaults to the server's names. */
  xsrf?: XsrfOptions | false;
}

/** The default transport: the platform fetch with JSON encoding on both sides. */
export function fetchTransport(options: FetchTransportOptions = {}): Transport {
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const xsrf = options.xsrf === undefined ? defaultXsrf : options.xsrf;
  return async (request) => {
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    let body: string | undefined;
    if (request.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(request.body);
    }
    if (xsrf && request.method !== 'GET') {
      const token = readCookie(xsrf.cookieName);
      if (token !== undefined) {
        headers[xsrf.headerName] = token;
      }
    }
    const response = await doFetch(request.url, {
      method: request.method,
      headers,
      body,
      credentials: options.credentials ?? 'same-origin',
    });
    return { status: response.status, body: await decodeBody(response) };
  };
}

async function decodeBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Reads one cookie from the document, when there is a document; undefined otherwise. */
export function readCookie(name: string): string | undefined {
  const cookie = (globalThis as { document?: { cookie?: string } }).document?.cookie;
  if (!cookie) {
    return undefined;
  }
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

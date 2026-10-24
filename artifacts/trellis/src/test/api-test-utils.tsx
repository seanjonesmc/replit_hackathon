import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Test helpers for screens that read the API through the generated hooks:
 * a fake `fetch` answering by method and path, and a render with a fresh
 * query client. Component tests only; never imported by the app.
 */

export interface ApiCall {
  method: string;
  /** Path without the query string, e.g. "/api/authorizations". */
  path: string;
  search: string;
  body: unknown;
}

type Reply = { status?: number; body: unknown };
/** Keyed by "METHOD /api/path"; a function sees the call (and can change state). */
export type ApiRoutes = Record<string, Reply | ((call: ApiCall) => Reply)>;

/** Replaces `fetch` with `routes`; unknown routes answer 404. Returns every call made. */
export function mockApi(routes: ApiRoutes): ApiCall[] {
  const calls: ApiCall[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const call: ApiCall = {
      method,
      path: url.pathname,
      search: url.search,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const route = routes[`${method} ${url.pathname}`];
    const reply = typeof route === 'function' ? route(call) : (route ?? { status: 404, body: { error: 'Not found' } });
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  return calls;
}

/** How many times `method path` was called. */
export const countCalls = (calls: ApiCall[], method: string, path: string) =>
  calls.filter((c) => c.method === method && c.path === path).length;

let root: Root | null = null;
let host: HTMLElement | null = null;

/** Renders `ui` with a fresh query client (no retries). */
export function renderWithApi(ui: ReactNode): HTMLElement {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>));
  return host;
}

/** Unmounts what renderWithApi rendered and restores `fetch`. */
export function cleanupApi() {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  vi.restoreAllMocks();
}

/** Lets pending requests resolve and React commit, a few rounds deep. */
export async function settle(rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

/** Finds by test id anywhere in the document (dialogs render in a portal). */
export const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

/** Types into a React-controlled input or select (sets the value the way a user would, then fires the event). */
export function changeValue(el: HTMLElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}

/** Waits real time (e.g. for a polling interval), letting React commit. */
export async function wait(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

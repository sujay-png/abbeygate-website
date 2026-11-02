import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storeFetch, storeFetchWithHeaders } from './store-api';

describe('storeFetch resilient error handling and retries', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('retries on transient 500 error and returns successful response on second try', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(new Response('Internal Server Error', { status: 500, statusText: 'Server Error' }));
      }
      return Promise.resolve(new Response(JSON.stringify([{ id: 123, name: 'Test Product' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    const result = await storeFetch<Array<{ id: number; name: string }>>('/test-retry-product', {
      timeoutMs: 1000,
    });

    expect(callCount).toBe(2);
    expect(result).toEqual([{ id: 123, name: 'Test Product' }]);
  });

  it('serves stale cache when subsequent network calls fail completely', async () => {
    // 1. Initial successful call
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 999, name: 'Cached Notebook' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const first = await storeFetch<{ id: number; name: string }>('/cached-item', { timeoutMs: 1000 });
    expect(first.name).toBe('Cached Notebook');

    // 2. Subsequent call where network completely drops (504 timeout or network error)
    global.fetch = vi.fn().mockResolvedValue(
      new Response('Gateway Timeout', { status: 504, statusText: 'Gateway Timeout' })
    );

    const second = await storeFetch<{ id: number; name: string }>('/cached-item', { timeoutMs: 1000 });
    // Should gracefully return cached item instead of throwing
    expect(second.name).toBe('Cached Notebook');
  });

  it('parses JSON when WordPress prepends PHP warnings or HTML before JSON payload', async () => {
    const dirtyResponse = `<b>Notice</b>: Undefined variable in wp-content/plugins/...<br/>[{"id":456,"name":"Dorchester Diary"}]`;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(dirtyResponse, { status: 200, headers: { 'Content-Type': 'text/html' } })
    );

    const result = await storeFetch<Array<{ id: number; name: string }>>('/dirty-json-product', {
      timeoutMs: 1000,
    });

    expect(result).toEqual([{ id: 456, name: 'Dorchester Diary' }]);
  });

  it('storeFetchWithHeaders extracts pagination headers and parses payload safely', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, name: 'P1' }]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-wp-total': '42',
          'x-wp-totalpages': '5',
        },
      })
    );

    const res = await storeFetchWithHeaders<Array<{ id: number; name: string }>>('/paginated', {
      timeoutMs: 1000,
    });

    expect(res.total).toBe(42);
    expect(res.totalPages).toBe(5);
    expect(res.data).toEqual([{ id: 1, name: 'P1' }]);
  });
});

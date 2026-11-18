import { describe, it, expect } from 'vitest';
import nextConfig from '@/../next.config';

describe('HTTP Enterprise Security Headers Suite', () => {
  it('defines comprehensive headers on wildcard path /(.*)', async () => {
    expect(nextConfig.headers).toBeDefined();
    if (!nextConfig.headers) return;
    const headerConfigs = await nextConfig.headers();
    expect(headerConfigs.length).toBeGreaterThan(0);
    const rootRoute = headerConfigs.find((c) => c.source === '/(.*)');
    expect(rootRoute).toBeDefined();

    const headers = rootRoute?.headers || [];
    const headerKeys = headers.map((h) => h.key);

    expect(headerKeys).toContain('X-Frame-Options');
    expect(headerKeys).toContain('Strict-Transport-Security');
    expect(headerKeys).toContain('X-Content-Type-Options');
    expect(headerKeys).toContain('Referrer-Policy');
    expect(headerKeys).toContain('Permissions-Policy');
    expect(headerKeys).toContain('Content-Security-Policy');
  });

  it('enforces clickjacking defense with X-Frame-Options: DENY', async () => {
    if (!nextConfig.headers) return;
    const configs = await nextConfig.headers();
    const headers = configs[0].headers;
    const frameOptions = headers.find((h) => h.key === 'X-Frame-Options');
    expect(frameOptions?.value).toBe('DENY');
  });

  it('enforces MIME-type sniffing defense with X-Content-Type-Options: nosniff', async () => {
    if (!nextConfig.headers) return;
    const configs = await nextConfig.headers();
    const headers = configs[0].headers;
    const contentType = headers.find((h) => h.key === 'X-Content-Type-Options');
    expect(contentType?.value).toBe('nosniff');
  });

  it('configures Strict-Transport-Security with HSTS preloading enabled', async () => {
    if (!nextConfig.headers) return;
    const configs = await nextConfig.headers();
    const headers = configs[0].headers;
    const hsts = headers.find((h) => h.key === 'Strict-Transport-Security');
    expect(hsts?.value).toContain('max-age=63072000');
    expect(hsts?.value).toContain('includeSubDomains');
  });

  it('restricts device sensor capabilities via Permissions-Policy', async () => {
    if (!nextConfig.headers) return;
    const configs = await nextConfig.headers();
    const headers = configs[0].headers;
    const perm = headers.find((h) => h.key === 'Permissions-Policy');
    expect(perm?.value).toContain('camera=()');
    expect(perm?.value).toContain('microphone=()');
    expect(perm?.value).toContain('geolocation=()');
  });
});

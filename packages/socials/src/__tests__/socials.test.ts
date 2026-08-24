import { SocialPublisher, configFromEnv, missingConfig, PROVIDERS } from '../index';

const mockFetch = (responses: Record<string, any>) => {
  (global as any).fetch = jest.fn(async (url: string, init?: any) => {
    const key = Object.keys(responses).find((k) => url.includes(k));
    const payload = key ? responses[key] : {};
    return {
      ok: !payload.__error,
      status: payload.__error ? 400 : 200,
      json: async () => {
        const clone = { ...payload };
        delete clone.__error;
        return clone;
      },
    };
  });
};

describe('SocialPublisher', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('reports missing credentials without throwing', async () => {
    const publisher = new SocialPublisher({});
    const receipt = await publisher.publish({ text: 'hello', platforms: ['facebook'] });
    expect(receipt.results[0].ok).toBe(false);
    expect(receipt.results[0].error).toContain('missing credentials');
    expect(receipt.mode).toBe('direct');
  });

  it('publishes a text post to facebook', async () => {
    mockFetch({ '/feed': { id: 'page_1' } });
    const publisher = new SocialPublisher({
      facebook: { pageId: 'page_1', pageToken: 'tok' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'hello world', platforms: ['facebook'] });
    expect(receipt.results[0]).toMatchObject({ platform: 'facebook', ok: true, id: 'page_1' });
  });

  it('publishes a photo post to facebook and builds a permalink', async () => {
    mockFetch({ '/photos': { post_id: 'pid_9' } });
    const publisher = new SocialPublisher({
      facebook: { pageId: 'p', pageToken: 't' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({
      text: 'with image',
      imageUrl: 'https://example.com/x.png',
      platforms: ['facebook'],
    });
    expect(receipt.results[0].permalink).toContain('facebook.com/pid_9');
  });

  it('refuses instagram without media', async () => {
    const publisher = new SocialPublisher({
      instagram: { userId: 'ig1', accessToken: 't' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'no media', platforms: ['instagram'] });
    expect(receipt.results[0].ok).toBe(false);
    expect(receipt.results[0].error).toContain('requires');
  });

  it('creates and publishes an instagram container', async () => {
    mockFetch({
      '/media_publish': { id: 'ig_post_1' },
      '/media': { id: 'container_1' },
      'permalink': { permalink: 'https://www.instagram.com/p/abc/' },
    });
    const publisher = new SocialPublisher({
      instagram: { userId: 'ig1', accessToken: 't' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({
      text: 'pic',
      imageUrl: 'https://example.com/pic.jpg',
      platforms: ['instagram'],
    });
    expect(receipt.results[0].ok).toBe(true);
    expect(receipt.results[0].permalink).toContain('instagram.com');
  }, 20000);

  it('publishes a threads post', async () => {
    mockFetch({
      '/threads_publish': { id: 'th_post_1' },
      '/threads': { id: 'th_container_1' },
      'permalink': { permalink: 'https://www.threads.com/@x/post/1' },
    });
    const publisher = new SocialPublisher({
      threads: { userId: 'th1', accessToken: 't' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'threads hello', platforms: ['threads'] });
    expect(receipt.results[0].ok).toBe(true);
  }, 20000);

  it('publishes to telegram and builds a t.me permalink for handles', async () => {
    mockFetch({ 'sendMessage': { ok: true, result: { message_id: 42 } } });
    const publisher = new SocialPublisher({
      telegram: { botToken: 'bot:tok', channel: '@mychannel' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'to channel', platforms: ['telegram'] });
    expect(receipt.results[0]).toMatchObject({ ok: true, id: '42' });
    expect(receipt.results[0].permalink).toBe('https://t.me/mychannel/42');
  });

  it('signs and posts to x with oauth 1.0a', async () => {
    mockFetch({ '/2/tweets': { data: { id: 'tw_1', username: 'someuser' } } });
    const publisher = new SocialPublisher({
      x: { apiKey: 'k', apiSecret: 's', accessToken: 'a', accessSecret: 'b' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'hello x', platforms: ['x'] });
    expect(receipt.results[0]).toMatchObject({ ok: true, id: 'tw_1' });
    expect(receipt.results[0].permalink).toContain('x.com/someuser/status/tw_1');
  });

  it('publishes to multiple platforms and collects mixed results', async () => {
    mockFetch({
      '/feed': { id: 'fb_1' },
      'sendMessage': { ok: true, result: { message_id: 7 } },
    });
    const publisher = new SocialPublisher({
      facebook: { pageId: 'p', pageToken: 't' },
      telegram: { botToken: 'bot:tok', channel: '@chan' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'multi', platforms: ['facebook', 'telegram', 'threads'] });
    expect(receipt.results).toHaveLength(3);
    expect(receipt.results.find((r) => r.platform === 'threads')!.ok).toBe(false);
    expect(receipt.results.filter((r) => r.ok)).toHaveLength(2);
  });

  it('routes through hosted talocode cloud when enabled', async () => {
    mockFetch({ '/v1/worklane/socials/publish': { results: [{ platform: 'facebook', ok: true, id: 'hosted_1' }] } });
    const publisher = new SocialPublisher({
      hosted: { enabled: true, apiKey: 'tc_key', baseUrl: 'https://api.talocode.site' },
      receiptsDisabled: true,
    });
    const receipt = await publisher.publish({ text: 'hosted', platforms: ['facebook'] });
    expect(receipt.mode).toBe('hosted');
    expect(receipt.results[0]).toMatchObject({ ok: true, id: 'hosted_1' });
  });

  it('writes a jsonl receipt', async () => {
    const fs = require('node:fs');
    const os = require('node:os');
    const path = require('node:path');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-socials-'));
    mockFetch({ '/feed': { id: 'fb_receipt' } });
    const publisher = new SocialPublisher({
      facebook: { pageId: 'p', pageToken: 't' },
      receiptsDir: dir,
    });
    await publisher.publish({ text: 'receipt test', platforms: ['facebook'] });
    const lines = fs.readFileSync(path.join(dir, 'socials.jsonl'), 'utf8').trim().split('\n');
    const parsed = JSON.parse(lines[lines.length - 1]);
    expect(parsed.text).toBe('receipt test');
    expect(parsed.results[0].ok).toBe(true);
  });
});

describe('configFromEnv', () => {
  it('reads provider credentials from environment', () => {
    const config = configFromEnv({
      WORKLANE_FB_PAGE_ID: 'p1',
      WORKLANE_FB_PAGE_TOKEN: 't1',
      TALOCODE_API_KEY: 'tc',
    } as any);
    expect(config.facebook).toEqual({ pageId: 'p1', pageToken: 't1' });
    expect(config.hosted?.apiKey).toBe('tc');
    expect(config.hosted?.enabled).toBe(false);
  });

  it('lists missing platforms', () => {
    expect(missingConfig(['facebook', 'x'], {})).toEqual(['facebook', 'x']);
    expect(missingConfig(['facebook'], { facebook: { pageId: 'p', pageToken: 't' } })).toEqual([]);
  });

  it('exposes all five providers', () => {
    expect(Object.keys(PROVIDERS).sort()).toEqual(['facebook', 'instagram', 'telegram', 'threads', 'x']);
  });
});

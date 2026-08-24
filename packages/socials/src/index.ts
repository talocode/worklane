/**
 * WorkLane Socials — agent-managed publishing to Facebook, Instagram, Threads,
 * Telegram, and X through one publish call.
 *
 * Bring your own keys and secrets, or route through hosted Talocode Cloud with
 * a TALOCODE_API_KEY for scaling.
 */

export type SocialPlatform = 'facebook' | 'instagram' | 'threads' | 'telegram' | 'x';

export interface PublishRequest {
  text: string;
  platforms: SocialPlatform[];
  /** Public https URL — required by Instagram and Threads, optional elsewhere */
  imageUrl?: string;
  /** Public https URL for video (Facebook only in v0) */
  videoUrl?: string;
}

export interface PlatformResult {
  platform: SocialPlatform;
  ok: boolean;
  /** Platform post id when available */
  id?: string;
  /** Platform permalink when available */
  permalink?: string;
  error?: string;
}

export interface PublishReceipt {
  timestamp: string;
  text: string;
  results: PlatformResult[];
  mode: 'direct' | 'hosted';
}

export interface SocialsConfig {
  facebook?: {
    pageId: string;
    pageToken: string;
  };
  instagram?: {
    userId: string;
    accessToken: string;
  };
  threads?: {
    userId: string;
    accessToken: string;
  };
  telegram?: {
    botToken: string;
    /** Channel handle (@name) or numeric chat id */
    channel: string;
  };
  x?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
  hosted?: {
    /** Route every publish through Talocode Cloud instead of direct APIs */
    enabled: boolean;
    baseUrl?: string;
    apiKey: string;
  };
  /** Directory for JSONL receipts; defaults to ./.worklane/receipts */
  receiptsDir?: string;
  /** Disable receipt writing entirely */
  receiptsDisabled?: boolean;
}

const GRAPH = 'https://graph.facebook.com/v21.0';
const THREADS_API = 'https://graph.threads.net/v1.0';
const TALOCODE_DEFAULT = 'https://api.talocode.site';

export const PLATFORM_ENV_VARS: Record<SocialPlatform, string[]> = {
  facebook: ['WORKLANE_FB_PAGE_ID', 'WORKLANE_FB_PAGE_TOKEN'],
  instagram: ['WORKLANE_IG_USER_ID', 'WORKLANE_IG_ACCESS_TOKEN'],
  threads: ['WORKLANE_THREADS_USER_ID', 'WORKLANE_THREADS_ACCESS_TOKEN'],
  telegram: ['WORKLANE_TELEGRAM_BOT_TOKEN', 'WORKLANE_TELEGRAM_CHANNEL'],
  x: ['WORKLANE_X_API_KEY', 'WORKLANE_X_API_SECRET', 'WORKLANE_X_ACCESS_TOKEN', 'WORKLANE_X_ACCESS_SECRET'],
};

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): SocialsConfig {
  const config: SocialsConfig = {};
  if (env.WORKLANE_FB_PAGE_ID && env.WORKLANE_FB_PAGE_TOKEN) {
    config.facebook = { pageId: env.WORKLANE_FB_PAGE_ID, pageToken: env.WORKLANE_FB_PAGE_TOKEN };
  }
  if (env.WORKLANE_IG_USER_ID && env.WORKLANE_IG_ACCESS_TOKEN) {
    config.instagram = { userId: env.WORKLANE_IG_USER_ID, accessToken: env.WORKLANE_IG_ACCESS_TOKEN };
  }
  if (env.WORKLANE_THREADS_USER_ID && env.WORKLANE_THREADS_ACCESS_TOKEN) {
    config.threads = { userId: env.WORKLANE_THREADS_USER_ID, accessToken: env.WORKLANE_THREADS_ACCESS_TOKEN };
  }
  if (env.WORKLANE_TELEGRAM_BOT_TOKEN && env.WORKLANE_TELEGRAM_CHANNEL) {
    config.telegram = { botToken: env.WORKLANE_TELEGRAM_BOT_TOKEN, channel: env.WORKLANE_TELEGRAM_CHANNEL };
  }
  if (
    env.WORKLANE_X_API_KEY && env.WORKLANE_X_API_SECRET &&
    env.WORKLANE_X_ACCESS_TOKEN && env.WORKLANE_X_ACCESS_SECRET
  ) {
    config.x = {
      apiKey: env.WORKLANE_X_API_KEY,
      apiSecret: env.WORKLANE_X_API_SECRET,
      accessToken: env.WORKLANE_X_ACCESS_TOKEN,
      accessSecret: env.WORKLANE_X_ACCESS_SECRET,
    };
  }
  if (env.TALOCODE_API_KEY) {
    config.hosted = {
      enabled: env.WORKLANE_HOSTED === '1' || env.WORKLANE_HOSTED === 'true',
      baseUrl: env.TALOCODE_BASE_URL || TALOCODE_DEFAULT,
      apiKey: env.TALOCODE_API_KEY,
    };
  }
  return config;
}

export function missingConfig(platforms: SocialPlatform[], config: SocialsConfig): SocialPlatform[] {
  return platforms.filter((p) => {
    if (config[p]) return false;
    return !(config.hosted?.enabled && config.hosted.apiKey);
  });
}

async function jsonForm(url: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

async function graphPost(url: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export interface SocialProvider {
  platform: SocialPlatform;
  publish(req: PublishRequest, cfg: any): Promise<PlatformResult>;
}

export class FacebookProvider implements SocialProvider {
  platform: SocialPlatform = 'facebook';

  async publish(req: PublishRequest, cfg: NonNullable<SocialsConfig['facebook']>): Promise<PlatformResult> {
    const { pageId, pageToken } = cfg;
    let out: any;
    if (req.videoUrl) {
      out = await graphPost(`${GRAPH}/${pageId}/videos`, {
        access_token: pageToken,
        description: req.text,
        file_url: req.videoUrl,
      });
    } else if (req.imageUrl) {
      out = await graphPost(`${GRAPH}/${pageId}/photos`, {
        access_token: pageToken,
        caption: req.text,
        url: req.imageUrl,
      });
    } else {
      out = await graphPost(`${GRAPH}/${pageId}/feed`, {
        access_token: pageToken,
        message: req.text,
      });
    }
    const id = out.post_id || out.id;
    return { platform: this.platform, ok: true, id, permalink: id ? `https://www.facebook.com/${id}` : undefined };
  }
}

export class InstagramProvider implements SocialProvider {
  platform: SocialPlatform = 'instagram';

  async publish(req: PublishRequest, cfg: NonNullable<SocialsConfig['instagram']>): Promise<PlatformResult> {
    const { userId, accessToken } = cfg;
    if (!req.imageUrl && !req.videoUrl) {
      return { platform: this.platform, ok: false, error: 'instagram requires imageUrl or videoUrl (public https URL)' };
    }
    const container: Record<string, string> = { access_token: accessToken, caption: req.text };
    if (req.videoUrl) {
      container.media_type = 'REELS';
      container.video_url = req.videoUrl;
    } else {
      container.image_url = req.imageUrl as string;
    }
    const created = await graphPost(`${GRAPH}/${userId}/media`, container);
    await new Promise((r) => setTimeout(r, req.videoUrl ? 25000 : 8000));
    const published = await graphPost(`${GRAPH}/${userId}/media_publish`, {
      access_token: accessToken,
      creation_id: created.id,
    });
    let permalink: string | undefined;
    try {
      const meta = await fetch(`${GRAPH}/${published.id}?fields=permalink&access_token=${accessToken}`);
      permalink = (await meta.json() as any).permalink;
    } catch {
      // permalink is best-effort
    }
    return { platform: this.platform, ok: true, id: published.id, permalink };
  }
}

export class ThreadsProvider implements SocialProvider {
  platform: SocialPlatform = 'threads';

  async publish(req: PublishRequest, cfg: NonNullable<SocialsConfig['threads']>): Promise<PlatformResult> {
    const { userId, accessToken } = cfg;
    const payload: Record<string, string> = {
      access_token: accessToken,
      media_type: req.imageUrl ? 'IMAGE' : 'TEXT',
      text: req.text.slice(0, 490),
    };
    if (req.imageUrl) {
      if (!req.imageUrl.startsWith('http')) {
        return { platform: this.platform, ok: false, error: 'threads imageUrl must be a public https URL' };
      }
      payload.image_url = req.imageUrl;
    }
    const created = await graphPost(`${THREADS_API}/${userId}/threads`, payload);
    await new Promise((r) => setTimeout(r, 5000));
    const published = await graphPost(`${THREADS_API}/${userId}/threads_publish`, {
      access_token: accessToken,
      creation_id: created.id,
    });
    let permalink: string | undefined;
    try {
      const meta = await fetch(`${THREADS_API}/${published.id}?fields=permalink&access_token=${accessToken}`);
      permalink = (await meta.json() as any).permalink;
    } catch {
      // best-effort
    }
    return { platform: this.platform, ok: true, id: published.id, permalink };
  }
}

export class TelegramProvider implements SocialProvider {
  platform: SocialPlatform = 'telegram';

  async publish(req: PublishRequest, cfg: NonNullable<SocialsConfig['telegram']>): Promise<PlatformResult> {
    const { botToken, channel } = cfg;
    const method = req.imageUrl ? 'sendPhoto' : 'sendMessage';
    const body: Record<string, string> =
      req.imageUrl
        ? { chat_id: channel, photo: req.imageUrl, caption: req.text.slice(0, 1024) }
        : { chat_id: channel, text: req.text.slice(0, 4096) };
    const out = await jsonForm(`https://api.telegram.org/bot${botToken}/${method}`, body);
    const messageId = out?.result?.message_id;
    let permalink: string | undefined;
    if (String(channel).startsWith('@') && messageId) {
      permalink = `https://t.me/${String(channel).slice(1)}/${messageId}`;
    }
    return { platform: this.platform, ok: out?.ok === true, id: messageId ? String(messageId) : undefined, permalink };
  }
}

export class XProvider implements SocialProvider {
  platform: SocialPlatform = 'x';

  private oauth1(method: string, url: string, cfg: NonNullable<SocialsConfig['x']>, bodyParams: Record<string, string> = {}): Record<string, string> {
    const crypto = require('node:crypto');
    const oauth: Record<string, string> = {
      oauth_consumer_key: cfg.apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: String(Math.floor(Date.now() / 1000)),
      oauth_token: cfg.accessToken,
      oauth_version: '1.0',
    };
    const all: Record<string, string> = { ...oauth, ...bodyParams };
    const baseParams = Object.keys(all)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(all[k])}`)
      .join('&');
    const baseUrl = url.split('?')[0];
    const base = [method.toUpperCase(), encodeURIComponent(baseUrl), encodeURIComponent(baseParams)].join('&');
    const key = `${encodeURIComponent(cfg.apiSecret)}&${encodeURIComponent(cfg.accessSecret)}`;
    oauth['oauth_signature'] = crypto.createHmac('sha1', key).update(base).digest('base64');
    return Object.keys(oauth).reduce((acc, k) => {
      acc[k] = k === 'oauth_signature' ? oauth[k] : String(oauth[k]);
      return acc;
    }, {} as Record<string, string>);
  }

  private authHeader(oauth: Record<string, string>): string {
    return (
      'OAuth ' +
      Object.keys(oauth)
        .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauth[k])}"`)
        .join(', ')
    );
  }

  async publish(req: PublishRequest, cfg: NonNullable<SocialsConfig['x']>): Promise<PlatformResult> {
    const tweetUrl = 'https://api.twitter.com/2/tweets';
    let mediaId: string | undefined;

    if (req.imageUrl && req.imageUrl.startsWith('http')) {
      const mediaRes = await fetch(req.imageUrl);
      if (!mediaRes.ok) {
        return { platform: this.platform, ok: false, error: `failed to download imageUrl: ${mediaRes.status}` };
      }
      const buf = Buffer.from(await mediaRes.arrayBuffer());
      const oauth = this.oauth1('POST', 'https://upload.twitter.com/1.1/media/upload.json', cfg);
      const form = new FormData();
      form.append('media_data', buf.toString('base64'));
      const up = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: { Authorization: this.authHeader(oauth) },
        body: form,
      });
      const upData: any = await up.json().catch(() => ({}));
      if (!up.ok) {
        return { platform: this.platform, ok: false, error: `media upload failed: ${JSON.stringify(upData).slice(0, 200)}` };
      }
      mediaId = upData.media_id_string;
    }

    const body: Record<string, any> = { text: req.text.slice(0, 280) };
    if (mediaId) body.media = { media_ids: [mediaId] };
    const oauth = this.oauth1('POST', tweetUrl, cfg, mediaId ? { media_ids: mediaId } : {});
    const res = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(oauth),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { platform: this.platform, ok: false, error: `${res.status} ${JSON.stringify(data).slice(0, 300)}` };
    }
    const id = data?.data?.id;
    const username = data?.data?.username;
    return {
      platform: this.platform,
      ok: true,
      id,
      permalink: id ? `https://x.com/${username || 'i'}/status/${id}` : undefined,
    };
  }
}

export const PROVIDERS: Record<SocialPlatform, SocialProvider> = {
  facebook: new FacebookProvider(),
  instagram: new InstagramProvider(),
  threads: new ThreadsProvider(),
  telegram: new TelegramProvider(),
  x: new XProvider(),
};

// ---------------------------------------------------------------------------
// Publisher
// ---------------------------------------------------------------------------

export class SocialPublisher {
  constructor(private config: SocialsConfig) {}

  platforms(): SocialPlatform[] {
    const skip = new Set<string>(['hosted', 'receiptsDir', 'receiptsDisabled']);
    return (Object.keys(this.config) as SocialPlatform[]).filter((k) => !skip.has(k));
  }

  private async publishHosted(req: PublishRequest): Promise<PublishReceipt> {
    const hosted = this.config.hosted!;
    const base = hosted.baseUrl || TALOCODE_DEFAULT;
    const res = await fetch(`${base}/v1/worklane/socials/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hosted.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Talocode Cloud error: ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
    }
    const receipt: PublishReceipt = {
      timestamp: new Date().toISOString(),
      text: req.text,
      results: data.results || [],
      mode: 'hosted',
    };
    this.writeReceipt(receipt);
    return receipt;
  }

  private writeReceipt(receipt: PublishReceipt): void {
    if (this.config.receiptsDisabled) return;
    try {
      const fs = require('node:fs');
      const path = require('node:path');
      const dir = this.config.receiptsDir || path.join(process.cwd(), '.worklane', 'receipts');
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(path.join(dir, 'socials.jsonl'), JSON.stringify(receipt) + '\n');
    } catch {
      // receipts are best-effort and never fail a publish
    }
  }

  async publish(req: PublishRequest): Promise<PublishReceipt> {
    if (this.config.hosted?.enabled && this.config.hosted.apiKey) {
      return this.publishHosted(req);
    }
    const missing = missingConfig(req.platforms, this.config);
    const results: PlatformResult[] = [];

    for (const platform of req.platforms) {
      if (missing.includes(platform)) {
        results.push({
          platform,
          ok: false,
          error: `missing credentials for ${platform} (set ${PLATFORM_ENV_VARS[platform].join(', ')})`,
        });
        continue;
      }
      try {
        const provider = PROVIDERS[platform];
        const result = await provider.publish(req, (this.config as any)[platform]);
        results.push(result);
      } catch (err: any) {
        results.push({ platform, ok: false, error: String(err?.message || err).slice(0, 300) });
      }
    }

    const receipt: PublishReceipt = {
      timestamp: new Date().toISOString(),
      text: req.text,
      results,
      mode: 'direct',
    };
    this.writeReceipt(receipt);
    return receipt;
  }
}

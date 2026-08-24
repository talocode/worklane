# WorkLane Socials

Publish one post to Facebook, Instagram, Threads, Telegram, and X through a single call — from your own keys, or scaled through hosted Talocode Cloud.

## Install

Socials ships inside WorkLane:

```bash
npm install @talocode/worklane        # full platform
# or the package directly
npm install @talocode/worklane-socials
```

## Quickstart (library)

```ts
import { SocialPublisher, configFromEnv } from '@talocode/worklane-socials';

const publisher = new SocialPublisher(configFromEnv());

const receipt = await publisher.publish({
  text: 'Ship day. New release is live.',
  platforms: ['facebook', 'instagram', 'threads', 'telegram', 'x'],
  imageUrl: 'https://example.com/banner.png', // public URL; required for Instagram
});

receipt.results.forEach((r) => {
  console.log(r.ok ? 'OK  ' : 'FAIL', r.platform, r.permalink || r.error || '');
});
```

## Quickstart (CLI)

```bash
# see what is configured
worklane socials:status

# publish
worklane socials:post \
  --text "Ship day. New release is live." \
  --platforms facebook,telegram,x \
  --image https://example.com/banner.png
```

## Credentials (bring your own keys)

Set environment variables for the platforms you want:

| Platform | Variables | Notes |
|----------|-----------|-------|
| Facebook | `WORKLANE_FB_PAGE_ID`, `WORKLANE_FB_PAGE_TOKEN` | Page token via Meta Graph API OAuth |
| Instagram | `WORKLANE_IG_USER_ID`, `WORKLANE_IG_ACCESS_TOKEN` | Professional account linked to a Facebook page |
| Threads | `WORKLANE_THREADS_USER_ID`, `WORKLANE_THREADS_ACCESS_TOKEN` | Threads API OAuth |
| Telegram | `WORKLANE_TELEGRAM_BOT_TOKEN`, `WORKLANE_TELEGRAM_CHANNEL` | Channel handle (`@name`) or chat id |
| X | `WORKLANE_X_API_KEY`, `WORKLANE_X_API_SECRET`, `WORKLANE_X_ACCESS_TOKEN`, `WORKLANE_X_ACCESS_SECRET` | OAuth 1.0a signing is built in |

Platform rules to know:

- Instagram and Threads require a **public https** `imageUrl` (or `videoUrl` for Instagram Reels); they cannot fetch local files.
- Threads text is capped at 490 characters, Telegram captions at 1024, X at 280.
- Instagram cannot edit or delete published posts through the API.

## Hosted scaling (Talocode Cloud)

Set `TALOCODE_API_KEY` and flip hosted mode on to route publishing through Talocode Cloud instead of direct platform calls:

```bash
export TALOCODE_API_KEY=your_key
export WORKLANE_HOSTED=1
worklane socials:post --text "hello" --platforms facebook,instagram,threads
```

Hosted requests go to `POST {TALOCODE_BASE_URL}/v1/worklane/socials/publish`. Connect your accounts once in the Talocode Cloud dashboard and publish from anywhere — no platform credentials on the calling machine.

## Receipts

Every publish appends a JSONL receipt to `.worklane/receipts/socials.jsonl` (disable with `receiptsDisabled`, or relocate with `receiptsDir`):

```json
{"timestamp":"2026-08-24T12:00:00.000Z","text":"...","mode":"direct","results":[{"platform":"facebook","ok":true,"id":"...","permalink":"..."}]}
```

## MCP / agent use

Any agent can call `SocialPublisher.publish` as a tool. The recommended agent workflow is: compose, show the human the post, get approval, then publish and read back the receipt.

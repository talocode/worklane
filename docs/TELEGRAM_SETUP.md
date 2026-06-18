# Telegram Setup

## Prerequisites

1. Node.js 18 or higher
2. A Telegram account
3. A bot token from @BotFather

## Step 1: Create a Telegram Bot

1. Open Telegram and search for @BotFather
2. Send `/newbot`
3. Choose a name for your bot (e.g., "WorkLane Bot")
4. Choose a username for your bot (e.g., "worklane_bot")
5. Copy the bot token

## Step 2: Configure WorkLane

```bash
# Set the bot token
export TELEGRAM_BOT_TOKEN=your_bot_token_here

# Set your AI provider API key
export OPENAI_API_KEY=your_api_key_here

# Initialize WorkLane
worklane init
```

## Step 3: Start the Bot

```bash
# Run the Telegram bot
worklane telegram

# Or run directly
npm run start
```

## Step 4: Test the Bot

1. Open Telegram
2. Search for your bot username
3. Send `/start`
4. Try the commands:
   - `/help` - Show help
   - `/agents` - List available agents
   - `/work summarize this test discussion`
   - `/remember project deadline is Friday`
   - `/status` - Show status

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show help |
| `/agents` | List available agents |
| `/work <task>` | Run a task |
| `/remember <fact>` | Store a fact |
| `/status` | Show status |

## Group Chat Usage

The bot can be added to group chats. Mention the bot or use commands to interact.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) |
| `OPENROUTER_API_KEY` | OpenRouter API key (if using OpenRouter) |

## Troubleshooting

### Bot doesn't respond

1. Check that `TELEGRAM_BOT_TOKEN` is set correctly
2. Ensure the bot is running
3. Check the logs for errors

### API errors

1. Verify your API key is correct
2. Check you have credits in your provider account
3. Ensure the provider URL is correct in config

### Rate limiting

Telegram has rate limits. If you hit them, wait a few seconds between messages.

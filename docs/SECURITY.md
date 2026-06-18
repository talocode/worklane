# Security

WorkLane is designed with security as a priority.

## Principles

1. **Never expose secrets**: API keys and tokens are never logged or printed
2. **No automatic external sends**: Sensitive actions require confirmation
3. **Local first**: All data stored locally by default
4. **Audit logging**: All agent actions are logged
5. **Permission-based**: Admin users can configure, regular users can request

## Secret Management

### API Keys

- Store in environment variables
- Never hardcode in source files
- Never log or print to console
- Config uses `env_key` to reference environment variables

### Bot Tokens

- Store in environment variables
- Never commit to version control
- Never share in chat or logs

## Sensitive Actions

The following actions require admin approval:

- Delete operations
- Remove operations
- Send email
- Send message
- Publish content

## Configuration Security

### .gitignore

Ensure these are in `.gitignore`:

```
.env
.env.local
.env.*.local
.worklane/
```

### Config File

The config file at `~/.worklane/config.toml` contains:

- Provider URLs (non-sensitive)
- Environment variable names (non-sensitive)
- No actual secrets

## Audit Logging

All agent actions are logged to:

```
.worklane/runs/
```

Each run includes:

- Request ID
- Agent name
- Input
- Output
- Timestamp
- Status

## Permissions

### Admin Users

- Can configure agents
- Can manage providers
- Can approve sensitive actions

### Regular Users

- Can request work from agents
- Cannot configure system
- Cannot approve sensitive actions

## Best Practices

1. Use environment variables for all secrets
2. Never commit `.env` files
3. Review agent logs regularly
4. Use least-privilege principle
5. Keep WorkLane updated

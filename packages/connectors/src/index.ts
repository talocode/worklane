import { Request, Response } from '@talocode/worklane-core';

export interface Connector {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(chatId: string, message: string): Promise<void>;
  onMessage(handler: (request: Request) => Promise<Response>): void;
}

export class TelegramConnector implements Connector {
  name = 'telegram';
  private bot: any;
  private messageHandler?: (request: Request) => Promise<Response>;

  constructor(private token: string) {}

  async connect(): Promise<void> {
    const TelegramBot = (await import('node-telegram-bot-api')).default;
    this.bot = new TelegramBot(this.token, { polling: true });
    
    this.bot.on('message', async (msg: any) => {
      if (!this.messageHandler) return;
      
      const chatId = msg.chat.id.toString();
      const text = msg.text || '';
      const userId = msg.from?.id?.toString() || 'unknown';
      
      const request: Request = {
        id: `tg-${msg.message_id}`,
        userId,
        command: text.split(' ')[0] || '',
        args: text.split(' ').slice(1),
        timestamp: new Date(),
        source: 'telegram',
        sourceId: chatId,
      };
      
      const response = await this.messageHandler(request);
      await this.sendMessage(chatId, this.formatResponse(response));
    });
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot not connected');
    }
    
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  onMessage(handler: (request: Request) => Promise<Response>): void {
    this.messageHandler = handler;
  }

  private formatResponse(response: Response): string {
    if (!response.success) {
      return `Error: ${response.error}`;
    }
    
    if (typeof response.data === 'string') {
      return response.data;
    }
    
    return JSON.stringify(response.data, null, 2);
  }
}

export class CLIConnector implements Connector {
  name = 'cli';
  private messageHandler?: (request: Request) => Promise<Response>;

  async connect(): Promise<void> {
    process.stdin.on('data', async (data) => {
      if (!this.messageHandler) return;
      
      const input = data.toString().trim();
      if (!input) return;
      
      const parts = input.split(' ');
      const command = parts[0] || '';
      const args = parts.slice(1);
      
      const request: Request = {
        id: `cli-${Date.now()}`,
        userId: 'cli-user',
        command,
        args,
        timestamp: new Date(),
        source: 'cli',
      };
      
      const response = await this.messageHandler(request);
      console.log(this.formatResponse(response));
    });
  }

  async disconnect(): Promise<void> {
    process.stdin.removeAllListeners();
  }

  async sendMessage(_chatId: string, message: string): Promise<void> {
    console.log(message);
  }

  onMessage(handler: (request: Request) => Promise<Response>): void {
    this.messageHandler = handler;
  }

  private formatResponse(response: Response): string {
    if (!response.success) {
      return `Error: ${response.error}`;
    }
    
    if (typeof response.data === 'string') {
      return response.data;
    }
    
    return JSON.stringify(response.data, null, 2);
  }
}

export class WebhookConnector implements Connector {
  name = 'webhook';
  private messageHandler?: (request: Request) => Promise<Response>;
  private expressApp?: any;

  constructor(private port: number = 3000) {}

  async connect(): Promise<void> {
    const express = (await import('express')).default;
    this.expressApp = express();
    
    this.expressApp.use(express.json());
    
    this.expressApp.post('/webhook', async (req: any, res: any) => {
      if (!this.messageHandler) {
        res.status(503).json({ error: 'Handler not configured' });
        return;
      }
      
      const { userId, command, args, source } = req.body;
      
      const request: Request = {
        id: `wh-${Date.now()}`,
        userId: userId || 'webhook-user',
        command: command || '',
        args: args || [],
        timestamp: new Date(),
        source: source || 'api',
      };
      
      const response = await this.messageHandler(request);
      res.json(response);
    });
    
    this.expressApp.listen(this.port, () => {
      console.log(`Webhook server listening on port ${this.port}`);
    });
  }

  async disconnect(): Promise<void> {
    if (this.expressApp) {
      this.expressApp.close();
    }
  }

  async sendMessage(_chatId: string, _message: string): Promise<void> {
    // Webhook responses are sent via HTTP response
  }

  onMessage(handler: (request: Request) => Promise<Response>): void {
    this.messageHandler = handler;
  }
}

export class ConnectorRegistry {
  private connectors: Map<string, Connector> = new Map();

  register(connector: Connector): void {
    this.connectors.set(connector.name, connector);
  }

  get(name: string): Connector | undefined {
    return this.connectors.get(name);
  }

  list(): Connector[] {
    return Array.from(this.connectors.values());
  }
}

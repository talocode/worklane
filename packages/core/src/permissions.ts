import { Request, Response } from './types.js';

export class Permissions {
  private adminUsers: Set<string> = new Set();
  private sensitiveActions: Set<string> = new Set([
    'delete',
    'remove',
    'send-email',
    'send-message',
    'publish',
  ]);

  addAdmin(userId: string): void {
    this.adminUsers.add(userId);
  }

  removeAdmin(userId: string): void {
    this.adminUsers.delete(userId);
  }

  isAdmin(userId: string): boolean {
    return this.adminUsers.has(userId);
  }

  requiresConfirmation(request: Request): boolean {
    const { command } = request;
    return Array.from(this.sensitiveActions).some(action => 
      command.toLowerCase().includes(action.toLowerCase())
    );
  }

  canExecute(request: Request): boolean {
    if (this.requiresConfirmation(request)) {
      return this.isAdmin(request.userId);
    }
    return true;
  }
}

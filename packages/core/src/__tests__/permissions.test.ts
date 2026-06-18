import { Permissions } from '../permissions';
import { Request } from '../types';

describe('Permissions', () => {
  let permissions: Permissions;

  beforeEach(() => {
    permissions = new Permissions();
  });

  it('should add and check admin users', () => {
    permissions.addAdmin('user-1');
    expect(permissions.isAdmin('user-1')).toBe(true);
    expect(permissions.isAdmin('user-2')).toBe(false);
  });

  it('should remove admin users', () => {
    permissions.addAdmin('user-1');
    permissions.removeAdmin('user-1');
    expect(permissions.isAdmin('user-1')).toBe(false);
  });

  it('should detect sensitive actions', () => {
    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'delete file',
      args: [],
      timestamp: new Date(),
      source: 'cli',
    };

    expect(permissions.requiresConfirmation(request)).toBe(true);
  });

  it('should not require confirmation for normal actions', () => {
    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'summarize text',
      args: [],
      timestamp: new Date(),
      source: 'cli',
    };

    expect(permissions.requiresConfirmation(request)).toBe(false);
  });

  it('should allow admin to execute sensitive actions', () => {
    permissions.addAdmin('user-1');

    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'delete file',
      args: [],
      timestamp: new Date(),
      source: 'cli',
    };

    expect(permissions.canExecute(request)).toBe(true);
  });

  it('should deny non-admin sensitive actions', () => {
    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'delete file',
      args: [],
      timestamp: new Date(),
      source: 'cli',
    };

    expect(permissions.canExecute(request)).toBe(false);
  });
});

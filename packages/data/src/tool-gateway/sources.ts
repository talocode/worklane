import type { ToolGatewaySource } from './types';

export function sourceConfigSignal(source: ToolGatewaySource): 'configured' | 'not_required' | 'missing_env' {
  if (!source.auth || source.auth.type === 'none') return 'not_required';
  if (!source.auth.envKeyName) return 'missing_env';
  return process.env[source.auth.envKeyName] ? 'configured' : 'missing_env';
}

export function sourceConfigSummary(source: ToolGatewaySource): string {
  const signal = sourceConfigSignal(source);
  if (signal === 'configured') return 'config present';
  if (signal === 'not_required') return 'no auth required';
  return 'config missing';
}

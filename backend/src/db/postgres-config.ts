import type { PoolConfig } from 'pg';

function hasSslRequiredParam(url: URL): boolean {
  return url.searchParams.get('sslmode') === 'require';
}

function isAivenConnection(url: URL): boolean {
  return url.hostname.includes('aiven');
}

function mustUseSsl(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    return hasSslRequiredParam(parsed) || isAivenConnection(parsed);
  } catch {
    return connectionString.includes('sslmode=require') || connectionString.includes('aiven');
  }
}

export function buildPostgresPoolConfig(connectionString: string): PoolConfig {
  const requireSsl = mustUseSsl(connectionString);

  return {
    connectionString,
    ...(requireSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

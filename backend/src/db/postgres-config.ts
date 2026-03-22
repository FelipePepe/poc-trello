import { readFileSync } from 'fs';
import type { ConnectionOptions } from 'tls';

export function normalizeConnectionString(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return raw;
  }
}

export function buildSslConfig(): ConnectionOptions | false {
  const needsSsl = Boolean(
    process.env['PG_SSL_CERT_PATH'] ||
    process.env['PG_SSL_CERT_BASE64'] ||
    process.env['PG_SSL_REJECT_UNAUTHORIZED'] === 'false',
  );

  if (!needsSsl) {
    return false;
  }

  const rejectUnauthorized = process.env['PG_SSL_REJECT_UNAUTHORIZED'] !== 'false';
  const ssl: ConnectionOptions = { rejectUnauthorized };

  const base64 = process.env['PG_SSL_CERT_BASE64'];
  const certPath = process.env['PG_SSL_CERT_PATH'];

  if (base64) {
    ssl.ca = Buffer.from(base64, 'base64').toString('utf-8');
  } else if (certPath) {
    ssl.ca = readFileSync(certPath).toString();
  }

  return ssl;
}

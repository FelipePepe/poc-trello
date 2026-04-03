import { config } from 'dotenv';
import path from 'node:path';

const env = process.env['NODE_ENV'] ?? 'development';

const envFileMap: Record<string, string> = {
  production: '.env.production',
  pre: '.env.pre',
};

const envFile = envFileMap[env] ?? '.env';

config({ path: path.resolve(process.cwd(), envFile) });

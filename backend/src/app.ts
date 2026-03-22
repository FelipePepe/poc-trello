import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { generateSecret, generateURI } from 'otplib';

import { initDb } from './db';
import authRouter from './routes/auth.routes';
import { requireAuth } from './middleware/auth.middleware';
import boardsRouter from './routes/boards.routes';
import listsRouter from './routes/lists.routes';
import listStandaloneRouter from './routes/list-standalone.routes';
import cardsRouter from './routes/cards.routes';
import cardStandaloneRouter from './routes/card-standalone.routes';
import customFieldsRouter from './routes/custom-fields.routes';
import customFieldStandaloneRouter from './routes/custom-field-standalone.routes';
import cardFieldValuesRouter from './routes/card-field-values.routes';

const app = express();

// ─── MFA secret auto-generation ──────────────────────────────────────────────
if (!process.env['MFA_SECRET']) {
  const secret = generateSecret();
  process.env['_MFA_SESSION_SECRET'] = secret;
  const adminEmail = process.env['ADMIN_EMAIL'] ?? 'admin@example.com';
  const otpauthUrl = generateURI({ secret, label: adminEmail, issuer: 'Trello Clone' });
  console.log('\n⚠️  MFA_SECRET no configurado. Secret generado para esta sesión:');
  console.log(`   Secret: ${secret}`);
  console.log(`   OTP URL: ${otpauthUrl}`);
  console.log('   Agregá MFA_SECRET=<secret> a tu .env para persistirlo.\n');
}

initDb();

// ─── Middleware ───────────────────────────────────────────────────────────────
const corsOrigin = process.env['CORS_ORIGIN'] ?? 'http://localhost:4200';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ─── OpenAPI / Swagger UI ────────────────────────────────────────────────────
const swaggerDoc = YAML.load(path.join(__dirname, 'openapi/openapi.yaml'));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'Trello Clone API',
    swaggerOptions: { persistAuthorization: true },
  }),
);

// ─── Routes ──────────────────────────────────────────────────────────────────
// Auth (public)
app.use('/api/auth', authRouter);

// API (protected)
app.use('/api/boards', requireAuth, boardsRouter);
app.use('/api/boards/:boardId/lists', requireAuth, listsRouter);
app.use('/api/boards/:boardId/custom-fields', requireAuth, customFieldsRouter);
app.use('/api/lists', requireAuth, listStandaloneRouter);
app.use('/api/lists/:listId/cards', requireAuth, cardsRouter);
app.use('/api/cards', requireAuth, cardStandaloneRouter);
app.use('/api/custom-fields', requireAuth, customFieldStandaloneRouter);
app.use('/api/cards/:cardId/field-values', requireAuth, cardFieldValuesRouter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;

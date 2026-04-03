// Vercel serverless entry point at the /api route.
// Having this file at the repo root's api/ directory ensures Vercel
// correctly routes all /api/* requests to the Express app instead of
// returning a 404 from its built-in /api directory reservation.
import app from '../backend/src/app';

export default app;

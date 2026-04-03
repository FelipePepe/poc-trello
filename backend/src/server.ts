import './env';
import app from './app';

const PORT = process.env['PORT'] ?? 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 Swagger UI  at http://localhost:${PORT}/api-docs\n`);
});

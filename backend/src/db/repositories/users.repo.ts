import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { users } from '../schema';
import type { StoredAuthUser } from '../../models';

function mapRow(row: typeof users.$inferSelect): StoredAuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    mfaSecret: row.mfaSecret ?? null,
    mfaEnabled: row.mfaEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const usersRepo = {
  async findByEmail(email: string): Promise<StoredAuthUser | null> {
    const db = getDb();
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findById(id: string): Promise<StoredAuthUser | null> {
    const db = getDb();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] ? mapRow(rows[0]) : null;
  },
};

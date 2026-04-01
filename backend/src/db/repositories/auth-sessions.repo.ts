import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { authSessions } from '../schema';
import type { AuthSession, CreateAuthSessionDto } from '../../models';

function mapRow(row: typeof authSessions.$inferSelect): AuthSession {
  return {
    id: row.id,
    userId: row.userId,
    tokenId: row.tokenId,
    expiresAt: row.expiresAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const authSessionsRepo = {
  async create(dto: CreateAuthSessionDto): Promise<AuthSession> {
    const db = getDb();
    const rows = await db
      .insert(authSessions)
      .values({
        userId: dto.userId,
        tokenId: dto.tokenId,
        expiresAt: new Date(dto.expiresAt),
        lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : null,
      })
      .returning();
    return mapRow(rows[0]);
  },

  async findByTokenId(tokenId: string): Promise<AuthSession | null> {
    const db = getDb();
    const rows = await db.select().from(authSessions).where(eq(authSessions.tokenId, tokenId));
    return rows[0] ? mapRow(rows[0]) : null;
  },
};

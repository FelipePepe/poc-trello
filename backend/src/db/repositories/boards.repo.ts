import { and, eq } from 'drizzle-orm';
import { getDb } from '../client';
import { boards } from '../schema';
import type { Board, CreateBoardDto, UpdateBoardDto } from '../../models';

function mapRow(row: typeof boards.$inferSelect): Board {
  return {
    id: row.id,
    ownerId: row.ownerId ?? null,
    title: row.title,
    description: row.description,
    background: row.background,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const boardsRepo = {
  async findAll(ownerId?: string): Promise<Board[]> {
    const db = getDb();
    const rows = ownerId
      ? await db.select().from(boards).where(eq(boards.ownerId, ownerId)).orderBy(boards.createdAt)
      : await db.select().from(boards).orderBy(boards.createdAt);
    return rows.map(mapRow);
  },

  async findAllByOwner(ownerId: string): Promise<Board[]> {
    return boardsRepo.findAll(ownerId);
  },

  async findById(id: string, ownerId?: string): Promise<Board | null> {
    const db = getDb();
    const rows = ownerId
      ? await db
          .select()
          .from(boards)
          .where(and(eq(boards.id, id), eq(boards.ownerId, ownerId)))
      : await db.select().from(boards).where(eq(boards.id, id));
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByIdAndOwner(id: string, ownerId: string): Promise<Board | null> {
    return boardsRepo.findById(id, ownerId);
  },

  async create(dto: CreateBoardDto, ownerId?: string | null): Promise<Board> {
    const db = getDb();
    const rows = await db
      .insert(boards)
      .values({
        ownerId: ownerId ?? null,
        title: dto.title.trim(),
        description: dto.description ?? '',
        background: dto.background ?? '#0052CC',
      })
      .returning();
    return mapRow(rows[0]);
  },

  async update(id: string, dto: UpdateBoardDto, ownerId?: string): Promise<Board | null> {
    const db = getDb();
    const updates: Partial<typeof boards.$inferInsert> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.background !== undefined) updates.background = dto.background;
    updates.updatedAt = new Date();
    const rows = await db
      .update(boards)
      .set(updates)
      .where(ownerId ? and(eq(boards.id, id), eq(boards.ownerId, ownerId)) : eq(boards.id, id))
      .returning();
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async delete(id: string, ownerId?: string): Promise<boolean> {
    const db = getDb();
    const rows = await db
      .delete(boards)
      .where(ownerId ? and(eq(boards.id, id), eq(boards.ownerId, ownerId)) : eq(boards.id, id))
      .returning();
    return rows.length > 0;
  },
};

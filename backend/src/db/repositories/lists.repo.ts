import { eq, asc } from 'drizzle-orm';
import { getDb } from '../client';
import { lists } from '../schema';
import type { BoardList, CreateListDto, UpdateListDto } from '../../models';

function mapRow(row: typeof lists.$inferSelect): BoardList {
  return {
    id: row.id,
    boardId: row.boardId,
    title: row.title,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const listsRepo = {
  async findByBoard(boardId: string): Promise<BoardList[]> {
    const db = getDb();
    const rows = await db.select().from(lists).where(eq(lists.boardId, boardId)).orderBy(asc(lists.position));
    return rows.map(mapRow);
  },

  async findById(id: string): Promise<BoardList | null> {
    const db = getDb();
    const rows = await db.select().from(lists).where(eq(lists.id, id));
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(boardId: string, dto: CreateListDto): Promise<BoardList> {
    const db = getDb();
    const existing = await db.select().from(lists).where(eq(lists.boardId, boardId)).orderBy(asc(lists.position));
    const position = existing.length;
    const rows = await db.insert(lists).values({
      boardId,
      title: dto.title.trim(),
      position,
    }).returning();
    return mapRow(rows[0]);
  },

  async update(id: string, dto: UpdateListDto): Promise<BoardList | null> {
    const db = getDb();
    const updates: Partial<typeof lists.$inferInsert> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    updates.updatedAt = new Date();
    const rows = await db.update(lists).set(updates).where(eq(lists.id, id)).returning();
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async reorder(boardId: string, orderedIds: string[]): Promise<BoardList[]> {
    const db = getDb();
    await Promise.all(
      orderedIds.map((id, position) =>
        db.update(lists).set({ position, updatedAt: new Date() }).where(eq(lists.id, id))
      )
    );
    const rows = await db.select().from(lists).where(eq(lists.boardId, boardId)).orderBy(asc(lists.position));
    return rows.map(mapRow);
  },

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const rows = await db.delete(lists).where(eq(lists.id, id)).returning();
    return rows.length > 0;
  },
};

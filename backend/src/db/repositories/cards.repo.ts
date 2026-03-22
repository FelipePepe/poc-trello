import { eq, asc } from 'drizzle-orm';
import { getDb } from '../client';
import { cards } from '../schema';
import type { Card, CreateCardDto, UpdateCardDto } from '../../models';
import type { Label } from '../../models';

type MoveCardDto = { listId: string; position?: number };

function mapRow(row: typeof cards.$inferSelect): Card {
  return {
    id: row.id,
    listId: row.listId,
    boardId: row.boardId,
    title: row.title,
    description: row.description,
    position: row.position,
    labels: (row.labels as Label[]) ?? [],
    dueDate: row.dueDate ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const cardsRepo = {
  async findByList(listId: string): Promise<Card[]> {
    const db = getDb();
    const rows = await db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.position));
    return rows.map(mapRow);
  },

  async findByBoard(boardId: string): Promise<Card[]> {
    const db = getDb();
    const rows = await db.select().from(cards).where(eq(cards.boardId, boardId));
    return rows.map(mapRow);
  },

  async findById(id: string): Promise<Card | null> {
    const db = getDb();
    const rows = await db.select().from(cards).where(eq(cards.id, id));
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(listId: string, dto: CreateCardDto, boardId: string): Promise<Card> {
    const db = getDb();
    const existing = await db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.position));
    const position = existing.length;
    const rows = await db.insert(cards).values({
      listId,
      boardId,
      title: dto.title.trim(),
      description: dto.description ?? '',
      position,
      labels: dto.labels ?? [],
      dueDate: dto.dueDate ?? null,
    }).returning();
    return mapRow(rows[0]);
  },

  async update(id: string, dto: UpdateCardDto): Promise<Card | null> {
    const db = getDb();
    const updates: Partial<typeof cards.$inferInsert> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.labels !== undefined) updates.labels = dto.labels;
    if (dto.dueDate !== undefined) updates.dueDate = dto.dueDate;
    updates.updatedAt = new Date();
    const rows = await db.update(cards).set(updates).where(eq(cards.id, id)).returning();
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async move(id: string, dto: MoveCardDto): Promise<Card | null> {
    const db = getDb();
    const existing = await db.select().from(cards).where(eq(cards.listId, dto.listId)).orderBy(asc(cards.position));
    const position = dto.position ?? existing.length;
    const rows = await db.update(cards).set({
      listId: dto.listId,
      position,
      updatedAt: new Date(),
    }).where(eq(cards.id, id)).returning();
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async reorder(listId: string, orderedIds: string[]): Promise<Card[]> {
    const db = getDb();
    await Promise.all(
      orderedIds.map((id, position) =>
        db.update(cards).set({ position, updatedAt: new Date() }).where(eq(cards.id, id))
      )
    );
    const rows = await db.select().from(cards).where(eq(cards.listId, listId)).orderBy(asc(cards.position));
    return rows.map(mapRow);
  },

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const rows = await db.delete(cards).where(eq(cards.id, id)).returning();
    return rows.length > 0;
  },
};

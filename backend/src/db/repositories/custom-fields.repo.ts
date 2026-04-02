import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { customFields } from '../schema';
import type { CustomField, CreateCustomFieldDto, UpdateCustomFieldDto } from '../../models';

function mapRow(row: typeof customFields.$inferSelect): CustomField {
  return {
    id: row.id,
    boardId: row.boardId,
    name: row.name,
    type: row.type as CustomField['type'],
    options: row.options ? (row.options as string[]) : null,
    position: row.position,
    showOnCard: row.showOnCard,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const customFieldsRepo = {
  async findByBoardId(boardId: string): Promise<CustomField[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(customFields)
      .where(eq(customFields.boardId, boardId))
      .orderBy(customFields.position);
    return rows.map(mapRow);
  },

  async findById(id: string): Promise<CustomField | null> {
    const db = getDb();
    const rows = await db.select().from(customFields).where(eq(customFields.id, id));
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(boardId: string, dto: CreateCustomFieldDto): Promise<CustomField> {
    const db = getDb();
    const rows = await db
      .insert(customFields)
      .values({
        boardId,
        name: dto.name.trim(),
        type: dto.type,
        options: dto.options ?? null,
        position: dto.position ?? 0,
        showOnCard: dto.showOnCard ?? false,
      })
      .returning();
    return mapRow(rows[0]);
  },

  async update(id: string, dto: UpdateCustomFieldDto): Promise<CustomField | null> {
    const db = getDb();
    const updates: Partial<typeof customFields.$inferInsert> = {};
    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.options !== undefined) updates.options = dto.options;
    if (dto.position !== undefined) updates.position = dto.position;
    if (dto.showOnCard !== undefined) updates.showOnCard = dto.showOnCard;
    updates.updatedAt = new Date();
    const rows = await db
      .update(customFields)
      .set(updates)
      .where(eq(customFields.id, id))
      .returning();
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id: string): Promise<boolean> {
    const db = getDb();
    const rows = await db.delete(customFields).where(eq(customFields.id, id)).returning();
    return rows.length > 0;
  },
};

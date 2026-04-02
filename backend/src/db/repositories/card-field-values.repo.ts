import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '../client';
import { cardCustomFieldValues } from '../schema';
import type { CardFieldValue, UpsertCardFieldValueDto } from '../../models';

function mapRow(row: typeof cardCustomFieldValues.$inferSelect): CardFieldValue {
  return {
    id: row.id,
    cardId: row.cardId,
    fieldId: row.fieldId,
    value: row.value ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const cardFieldValuesRepo = {
  async findByCardIds(cardIds: string[]): Promise<CardFieldValue[]> {
    if (cardIds.length === 0) return [];
    const db = getDb();
    const rows = await db
      .select()
      .from(cardCustomFieldValues)
      .where(inArray(cardCustomFieldValues.cardId, cardIds));
    return rows.map(mapRow);
  },

  async findByCardId(cardId: string): Promise<CardFieldValue[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(cardCustomFieldValues)
      .where(eq(cardCustomFieldValues.cardId, cardId));
    return rows.map(mapRow);
  },

  async upsert(
    cardId: string,
    fieldId: string,
    dto: UpsertCardFieldValueDto,
  ): Promise<CardFieldValue> {
    const db = getDb();
    const rows = await db
      .insert(cardCustomFieldValues)
      .values({
        cardId,
        fieldId,
        value: dto.value,
      })
      .onConflictDoUpdate({
        target: [cardCustomFieldValues.cardId, cardCustomFieldValues.fieldId],
        set: {
          value: dto.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return mapRow(rows[0]);
  },

  async remove(cardId: string, fieldId: string): Promise<boolean> {
    const db = getDb();
    const rows = await db
      .delete(cardCustomFieldValues)
      .where(
        and(eq(cardCustomFieldValues.cardId, cardId), eq(cardCustomFieldValues.fieldId, fieldId)),
      )
      .returning();
    return rows.length > 0;
  },
};

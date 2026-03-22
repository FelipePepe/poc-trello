import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const boards = pgTable('boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  background: varchar('background', { length: 7 }).notNull().default('#0052CC'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lists = pgTable('lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  position: integer('position').notNull().default(0),
  labels: jsonb('labels').notNull().default([]),
  dueDate: varchar('due_date', { length: 30 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customFields = pgTable('custom_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  options: jsonb('options').default(null),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cardCustomFieldValues = pgTable('card_custom_field_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  value: text('value'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('card_field_unique_idx').on(table.cardId, table.fieldId),
]);

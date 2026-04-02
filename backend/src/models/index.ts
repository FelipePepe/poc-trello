export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  id: string;
  ownerId: string | null;
  title: string;
  description: string;
  background: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardList {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  listId: string;
  boardId: string;
  title: string;
  description: string;
  position: number;
  labels: Label[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  customFieldValues?: CardFieldValue[];
}

export type CreateBoardDto = Pick<Board, 'title' | 'description' | 'background'>;
export type UpdateBoardDto = Partial<CreateBoardDto>;

export type CreateListDto = { title: string };
export type UpdateListDto = Partial<CreateListDto> & { position?: number };

export type CreateCardDto = {
  title: string;
  description?: string;
  dueDate?: string;
  labels?: Label[];
};
export type UpdateCardDto = Partial<CreateCardDto & { position: number; listId: string }>;

export type CustomFieldType = 'text' | 'number' | 'checkbox' | 'date' | 'select';

export interface CustomField {
  id: string;
  boardId: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  position: number;
  showOnCard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardFieldValue {
  id: string;
  cardId: string;
  fieldId: string;
  value: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateCustomFieldDto = Pick<CustomField, 'name' | 'type'> & {
  options?: string[] | null;
  position?: number;
  showOnCard?: boolean;
};
export type UpdateCustomFieldDto = Partial<
  Pick<CustomField, 'name' | 'options' | 'position' | 'showOnCard'>
>;
export type UpsertCardFieldValueDto = Pick<CardFieldValue, 'value'>;

export * from './auth';

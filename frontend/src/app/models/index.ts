export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  id: string;
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

export type CustomFieldType = 'text' | 'number' | 'checkbox' | 'date' | 'select';

export interface CustomField {
  id: string;
  boardId: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  position: number;
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

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  mfaRequired?: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthenticatedUser;
}

export type CreateCustomFieldDto = {
  name: string;
  type: CustomFieldType;
  options?: string[];
  position?: number;
};

export type UpsertCardFieldValueDto = {
  value: string | null;
};

export type CreateBoardDto = {
  title: string;
  description?: string;
  background?: string;
};

export type UpdateBoardDto = Partial<Pick<Board, 'title' | 'description' | 'background'>>;

export type CreateListDto = Pick<BoardList, 'title'>;

export type CreateCardDto = Pick<Card, 'title'> & {
  description?: string;
  dueDate?: string | null;
  labels?: Label[];
};

export type UpdateCardDto = Partial<CreateCardDto> & {
  position?: number;
  listId?: string;
};

export const LABEL_PRESETS: Omit<Label, 'id'>[] = [
  { name: 'Bug', color: '#FF5630' },
  { name: 'Feature', color: '#36B37E' },
  { name: 'Design', color: '#FF7452' },
  { name: 'Backend', color: '#6554C0' },
  { name: 'Frontend', color: '#0052CC' },
  { name: 'Urgent', color: '#FF8B00' },
  { name: 'Testing', color: '#00B8D9' },
  { name: 'Docs', color: '#57D9A3' },
];

export const BOARD_BACKGROUNDS = [
  '#0052CC',
  '#0065FF',
  '#253858',
  '#172B4D',
  '#00875A',
  '#36B37E',
  '#FF5630',
  '#DE350B',
  '#FF8B00',
  '#FF7452',
  '#6554C0',
  '#8777D9',
  '#00B8D9',
  '#57D9A3',
  '#4C9AFF',
  '#B8ACF6',
];

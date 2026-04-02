import { Board, BoardList, Card } from '../models';
import { v4 as uuidv4 } from 'uuid';

// --- Seed data ---
const now = new Date().toISOString();

const boards: Board[] = [
  {
    id: uuidv4(),
    ownerId: null,
    title: 'Proyecto Web',
    description: 'Tablero principal del proyecto web',
    background: '#0052CC',
    createdAt: now,
    updatedAt: now,
  },
];

const lists: BoardList[] = [
  {
    id: uuidv4(),
    boardId: boards[0].id,
    title: 'Por hacer',
    position: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    boardId: boards[0].id,
    title: 'En progreso',
    position: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    boardId: boards[0].id,
    title: 'Hecho',
    position: 2,
    createdAt: now,
    updatedAt: now,
  },
];

const cards: Card[] = [
  {
    id: uuidv4(),
    listId: lists[0].id,
    boardId: boards[0].id,
    title: 'Diseñar mockups de UI',
    description: 'Crear los wireframes y mockups en Figma',
    position: 0,
    labels: [{ id: uuidv4(), name: 'Design', color: '#FF7452' }],
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    listId: lists[0].id,
    boardId: boards[0].id,
    title: 'Setup del proyecto Angular',
    description: '',
    position: 1,
    labels: [{ id: uuidv4(), name: 'Frontend', color: '#36B37E' }],
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    listId: lists[1].id,
    boardId: boards[0].id,
    title: 'API REST con TypeScript',
    description: 'Implementar endpoints de boards, lists y cards',
    position: 0,
    labels: [{ id: uuidv4(), name: 'Backend', color: '#6554C0' }],
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  },
];

// --- Store ---
export const store = {
  boards,
  lists,
  cards,
};

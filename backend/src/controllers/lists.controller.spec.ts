import type { Request } from 'express';
import { createMockResponse } from '../test-utils/http-mocks';
import {
  getListsByBoard,
  createList,
  updateList,
  deleteList,
  reorderLists,
} from './lists.controller';
import { listsRepo } from '../db/repositories/lists.repo';
import { boardsRepo } from '../db/repositories/boards.repo';

vi.mock('../db/repositories/lists.repo', () => ({
  listsRepo: {
    findByBoard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
  },
}));

vi.mock('../db/repositories/boards.repo', () => ({
  boardsRepo: {
    findById: vi.fn(),
  },
}));

describe('lists.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getListsByBoard returns 404 if board missing', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await getListsByBoard({ params: { boardId: 'b1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('createList validates title', async () => {
    const { res, status } = createMockResponse();

    await createList({ params: { boardId: 'b1' }, body: { title: '' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('createList returns 201 for valid payload', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'b1' } as never);
    vi.mocked(listsRepo.create).mockResolvedValue({ id: 'l1', title: 'Todo' } as never);
    const { res, status } = createMockResponse();

    await createList(
      { params: { boardId: 'b1' }, body: { title: 'Todo' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(201);
  });

  it('getListsByBoard returns lists for existing board', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'b1' } as never);
    vi.mocked(listsRepo.findByBoard).mockResolvedValue([{ id: 'l1' }] as never);
    const { res, json } = createMockResponse();

    await getListsByBoard({ params: { boardId: 'b1' } } as unknown as Request, res);

    expect(json).toHaveBeenCalledWith([{ id: 'l1' }]);
  });

  it('createList returns 404 for missing board', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await createList(
      { params: { boardId: 'b1' }, body: { title: 'Todo' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(404);
  });

  it('updateList returns 404 when missing', async () => {
    vi.mocked(listsRepo.update).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await updateList({ params: { id: 'l1' }, body: { title: 'Done' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('updateList returns updated list', async () => {
    vi.mocked(listsRepo.update).mockResolvedValue({ id: 'l1', title: 'Done' } as never);
    const { res, json } = createMockResponse();

    await updateList({ params: { id: 'l1' }, body: { title: 'Done' } } as unknown as Request, res);

    expect(json).toHaveBeenCalledWith({ id: 'l1', title: 'Done' });
  });

  it('deleteList returns 204 when deleted', async () => {
    vi.mocked(listsRepo.delete).mockResolvedValue(true);
    const { res, status } = createMockResponse();

    await deleteList({ params: { id: 'l1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(204);
  });

  it('deleteList returns 404 when missing', async () => {
    vi.mocked(listsRepo.delete).mockResolvedValue(false);
    const { res, status } = createMockResponse();

    await deleteList({ params: { id: 'l1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('reorderLists validates orderedIds', async () => {
    const { res, status } = createMockResponse();

    await reorderLists({ params: { boardId: 'b1' }, body: {} } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('reorderLists returns reordered lists', async () => {
    vi.mocked(listsRepo.reorder).mockResolvedValue([{ id: 'l2' }, { id: 'l1' }] as never);
    const { res, json } = createMockResponse();

    await reorderLists(
      { params: { boardId: 'b1' }, body: { orderedIds: ['l2', 'l1'] } } as unknown as Request,
      res,
    );

    expect(json).toHaveBeenCalledWith([{ id: 'l2' }, { id: 'l1' }]);
  });

  it('returns 500 when repository throws', async () => {
    vi.mocked(listsRepo.findByBoard).mockRejectedValue(new Error('db error'));
    vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'b1' } as never);
    const { res, status } = createMockResponse();

    await getListsByBoard({ params: { boardId: 'b1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(500);
  });
});

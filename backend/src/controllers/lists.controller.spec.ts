import type { Request } from 'express';
import { createMockResponse } from '../test-utils/http-mocks';
import { createMockRequest } from '../test-utils/http-mocks';
import {
  getListsByBoard,
  createList,
  updateList,
  deleteList,
  reorderLists,
} from './lists.controller';
import { listsRepo } from '../db/repositories/lists.repo';
import { boardsRepo } from '../db/repositories/boards.repo';
import { authChecksRepo } from '../db/repositories/auth-checks.repo';

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

vi.mock('../db/repositories/auth-checks.repo', () => ({
  authChecksRepo: {
    isBoardOwner: vi.fn(),
    isListBoardOwner: vi.fn(),
  },
}));

describe('lists.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authorization checks pass (user is owner)
    vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);
    vi.mocked(authChecksRepo.isListBoardOwner).mockResolvedValue(true);
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
      createMockRequest({ params: { boardId: 'b1' }, body: { title: 'Todo' } }),
      res,
    );

    expect(status).toHaveBeenCalledWith(201);
  });

  it('getListsByBoard returns lists for existing board', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'b1' } as never);
    vi.mocked(listsRepo.findByBoard).mockResolvedValue([{ id: 'l1' }] as never);
    const { res, json } = createMockResponse();

    await getListsByBoard(createMockRequest({ params: { boardId: 'b1' } }), res);

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

    await updateList(createMockRequest({ params: { id: 'l1' }, body: { title: 'Done' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('updateList returns updated list', async () => {
    vi.mocked(listsRepo.update).mockResolvedValue({ id: 'l1', title: 'Done' } as never);
    const { res, json } = createMockResponse();

    await updateList(createMockRequest({ params: { id: 'l1' }, body: { title: 'Done' } }), res);

    expect(json).toHaveBeenCalledWith({ id: 'l1', title: 'Done' });
  });

  it('deleteList returns 204 when deleted', async () => {
    vi.mocked(listsRepo.delete).mockResolvedValue(true);
    const { res, status } = createMockResponse();

    await deleteList(createMockRequest({ params: { id: 'l1' } }), res);

    expect(status).toHaveBeenCalledWith(204);
  });

  it('deleteList returns 404 when missing', async () => {
    vi.mocked(listsRepo.delete).mockResolvedValue(false);
    const { res, status } = createMockResponse();

    await deleteList(createMockRequest({ params: { id: 'l1' } }), res);

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
      createMockRequest({ params: { boardId: 'b1' }, body: { orderedIds: ['l2', 'l1'] } }),
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

  // Authorization (owner-scope) tests — Phase 3
  describe('authorization (owner-scope)', () => {
    it('getListsByBoard returns 403 when user is not the board owner', async () => {
      const board = { id: 'b1', ownerId: 'owner-user-id' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { boardId: 'b1' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await getListsByBoard(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('getListsByBoard returns lists when user is the board owner', async () => {
      const board = { id: 'b1', ownerId: 'user-a' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);
      vi.mocked(listsRepo.findByBoard).mockResolvedValue([{ id: 'l1', title: 'Todo' }] as never);

      const { res, json } = createMockResponse();
      const req = {
        params: { boardId: 'b1' },
        user: { id: 'user-a', email: 'a@test.com', name: 'User A', sessionId: 's1' },
      } as unknown as Request;

      await getListsByBoard(req, res);

      expect(json).toHaveBeenCalledWith([{ id: 'l1', title: 'Todo' }]);
    });

    it('updateList returns 403 when user is not the list board owner', async () => {
      vi.mocked(authChecksRepo.isListBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'l1' },
        body: { title: 'Updated' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await updateList(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('deleteList returns 403 when user is not the list board owner', async () => {
      vi.mocked(authChecksRepo.isListBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'l1' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await deleteList(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });
  });
});

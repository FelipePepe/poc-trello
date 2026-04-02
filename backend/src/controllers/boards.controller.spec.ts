import type { Request } from 'express';
import { createMockResponse } from '../test-utils/http-mocks';
import { createMockRequest } from '../test-utils/http-mocks';
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} from './boards.controller';
import { boardsRepo } from '../db/repositories/boards.repo';
import { authChecksRepo } from '../db/repositories/auth-checks.repo';

vi.mock('../db/repositories/boards.repo', () => ({
  boardsRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../db/repositories/auth-checks.repo', () => ({
  authChecksRepo: {
    isBoardOwner: vi.fn(),
  },
}));

describe('boards.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authorization checks pass (user is owner)
    vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);
  });

  it('getBoards returns list', async () => {
    vi.mocked(boardsRepo.findAll).mockResolvedValue([{ id: 'b1' }] as never);
    const { res, json } = createMockResponse();

    await getBoards({} as Request, res);

    expect(json).toHaveBeenCalledWith([{ id: 'b1' }]);
  });

  it('getBoardById returns 404 when missing', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await getBoardById({ params: { id: 'x' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('getBoardById returns board when found', async () => {
    vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'b1', title: 'A' } as never);
    const { res, json } = createMockResponse();

    await getBoardById(createMockRequest({ params: { id: 'b1' } }), res);

    expect(json).toHaveBeenCalledWith({ id: 'b1', title: 'A' });
  });

  it('createBoard validates title', async () => {
    const { res, status } = createMockResponse();

    await createBoard({ body: { title: '   ' } } as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('createBoard returns 201', async () => {
    vi.mocked(boardsRepo.create).mockResolvedValue({ id: 'b1', title: 'A' } as never);
    const { res, status } = createMockResponse();

    await createBoard({ body: { title: 'A' } } as Request, res);

    expect(status).toHaveBeenCalledWith(201);
  });

  it('updateBoard returns 404 when missing', async () => {
    vi.mocked(boardsRepo.update).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await updateBoard({ params: { id: 'x' }, body: { title: 'B' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('updateBoard returns updated board', async () => {
    vi.mocked(boardsRepo.update).mockResolvedValue({ id: 'b1', title: 'B' } as never);
    vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'b1', title: 'B' } as never);
    const { res, json } = createMockResponse();

    await updateBoard(createMockRequest({ params: { id: 'b1' }, body: { title: 'B' } }), res);

    expect(json).toHaveBeenCalledWith({ id: 'b1', title: 'B' });
  });

  it('deleteBoard returns 204 when deleted', async () => {
    vi.mocked(boardsRepo.delete).mockResolvedValue(true);
    const { res, status, send } = createMockResponse();

    await deleteBoard(createMockRequest({ params: { id: 'x' } }), res);

    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalled();
  });

  it('deleteBoard returns 404 when board does not exist', async () => {
    vi.mocked(boardsRepo.delete).mockResolvedValue(false);
    const { res, status } = createMockResponse();

    await deleteBoard({ params: { id: 'x' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('returns 500 when repository throws', async () => {
    vi.mocked(boardsRepo.findAll).mockRejectedValue(new Error('db error'));
    const { res, status } = createMockResponse();

    await getBoards({} as Request, res);

    expect(status).toHaveBeenCalledWith(500);
  });

  // Authorization (owner-scope) tests — Phase 3
  describe('authorization (owner-scope)', () => {
    it('getBoardById returns 403 when user is not the owner', async () => {
      const board = { id: 'b1', ownerId: 'owner-user-id', title: 'Board' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'b1' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await getBoardById(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('getBoardById returns board when user is the owner', async () => {
      const board = { id: 'b1', ownerId: 'user-a', title: 'Board A' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);

      const { res, json } = createMockResponse();
      const req = {
        params: { id: 'b1' },
        user: { id: 'user-a', email: 'a@test.com', name: 'User A', sessionId: 's1' },
      } as unknown as Request;

      await getBoardById(req, res);

      expect(json).toHaveBeenCalledWith(board);
    });

    it('updateBoard returns 403 when user is not the owner', async () => {
      const board = { id: 'b1', ownerId: 'owner-user-id', title: 'Board' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'b1' },
        body: { title: 'Updated' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await updateBoard(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('updateBoard succeeds when user is the owner', async () => {
      const updatedBoard = { id: 'b1', ownerId: 'user-a', title: 'Updated' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(updatedBoard as never);
      vi.mocked(boardsRepo.update).mockResolvedValue(updatedBoard as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);

      const { res, json } = createMockResponse();
      const req = {
        params: { id: 'b1' },
        body: { title: 'Updated' },
        user: { id: 'user-a', email: 'a@test.com', name: 'User A', sessionId: 's1' },
      } as unknown as Request;

      await updateBoard(req, res);

      expect(json).toHaveBeenCalledWith(updatedBoard);
    });

    it('deleteBoard returns 403 when user is not the owner', async () => {
      const board = { id: 'b1', ownerId: 'owner-user-id', title: 'Board' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'b1' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await deleteBoard(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('deleteBoard succeeds when user is the owner', async () => {
      const board = { id: 'b1', ownerId: 'user-a', title: 'Board' };
      vi.mocked(boardsRepo.findById).mockResolvedValue(board as never);
      vi.mocked(boardsRepo.delete).mockResolvedValue(true);
      vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);

      const { res, status, send } = createMockResponse();
      const req = {
        params: { id: 'b1' },
        user: { id: 'user-a', email: 'a@test.com', name: 'User A', sessionId: 's1' },
      } as unknown as Request;

      await deleteBoard(req, res);

      expect(status).toHaveBeenCalledWith(204);
      expect(send).toHaveBeenCalled();
    });
  });
});
vi.mocked(boardsRepo.findById).mockResolvedValue({ id: 'x' } as never);

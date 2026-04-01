import type { Request } from 'express';
import { createMockResponse } from '../test-utils/http-mocks';
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} from './boards.controller';
import { boardsRepo } from '../db/repositories/boards.repo';

vi.mock('../db/repositories/boards.repo', () => ({
  boardsRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('boards.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await getBoardById({ params: { id: 'b1' } } as unknown as Request, res);

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
    const { res, json } = createMockResponse();

    await updateBoard({ params: { id: 'b1' }, body: { title: 'B' } } as unknown as Request, res);

    expect(json).toHaveBeenCalledWith({ id: 'b1', title: 'B' });
  });

  it('deleteBoard returns 204 when deleted', async () => {
    vi.mocked(boardsRepo.delete).mockResolvedValue(true);
    const { res, status, send } = createMockResponse();

    await deleteBoard({ params: { id: 'x' } } as unknown as Request, res);

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
});

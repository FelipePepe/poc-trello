import type { Request } from 'express';
import { createMockResponse } from '../test-utils/http-mocks';
import { createMockRequest } from '../test-utils/http-mocks';
import {
  getCardsByList,
  getCardsByBoard,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  reorderCards,
} from './cards.controller';
import { cardsRepo } from '../db/repositories/cards.repo';
import { listsRepo } from '../db/repositories/lists.repo';
import { cardFieldValuesRepo } from '../db/repositories/card-field-values.repo';
import { authChecksRepo } from '../db/repositories/auth-checks.repo';

vi.mock('../db/repositories/cards.repo', () => ({
  cardsRepo: {
    findByList: vi.fn(),
    findByBoard: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    move: vi.fn(),
    reorder: vi.fn(),
  },
}));

vi.mock('../db/repositories/lists.repo', () => ({
  listsRepo: {
    findById: vi.fn(),
  },
}));

vi.mock('../db/repositories/card-field-values.repo', () => ({
  cardFieldValuesRepo: {
    findByCardId: vi.fn(),
  },
}));

vi.mock('../db/repositories/auth-checks.repo', () => ({
  authChecksRepo: {
    isCardBoardOwner: vi.fn(),
    isBoardOwner: vi.fn(),
    isListBoardOwner: vi.fn(),
  },
}));

describe('cards.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authorization checks pass (user is owner)
    vi.mocked(authChecksRepo.isCardBoardOwner).mockResolvedValue(true);
    vi.mocked(authChecksRepo.isBoardOwner).mockResolvedValue(true);
    vi.mocked(authChecksRepo.isListBoardOwner).mockResolvedValue(true);
  });

  it('getCardsByList returns 404 when list is missing', async () => {
    vi.mocked(listsRepo.findById).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await getCardsByList(createMockRequest({ params: { listId: 'l1' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('getCardsByBoard returns cards', async () => {
    vi.mocked(cardsRepo.findByBoard).mockResolvedValue([{ id: 'c1' }] as never);
    const { res, json } = createMockResponse();

    await getCardsByBoard(createMockRequest({ params: { boardId: 'b1' } }), res);

    expect(json).toHaveBeenCalledWith([{ id: 'c1' }]);
  });

  it('getCardById returns card with customFieldValues', async () => {
    vi.mocked(cardsRepo.findById).mockResolvedValue({ id: 'c1' } as never);
    vi.mocked(cardFieldValuesRepo.findByCardId).mockResolvedValue([{ fieldId: 'f1' }] as never);
    const { res, json } = createMockResponse();

    await getCardById(createMockRequest({ params: { id: 'c1' } }), res);

    expect(json).toHaveBeenCalledWith({ id: 'c1', customFieldValues: [{ fieldId: 'f1' }] });
  });

  it('createCard validates title', async () => {
    const { res, status } = createMockResponse();

    await createCard(createMockRequest({ params: { listId: 'l1' }, body: { title: '' } }), res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('getCardsByList returns cards when list exists', async () => {
    vi.mocked(listsRepo.findById).mockResolvedValue({ id: 'l1' } as never);
    vi.mocked(cardsRepo.findByList).mockResolvedValue([{ id: 'c1' }] as never);
    const { res, json } = createMockResponse();

    await getCardsByList(createMockRequest({ params: { listId: 'l1' } }), res);

    expect(json).toHaveBeenCalledWith([{ id: 'c1' }]);
  });

  it('getCardById returns 404 when missing', async () => {
    vi.mocked(cardsRepo.findById).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await getCardById(createMockRequest({ params: { id: 'c1' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('createCard returns 404 when list is missing', async () => {
    vi.mocked(listsRepo.findById).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await createCard(createMockRequest({ params: { listId: 'l1' }, body: { title: 'Task' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('createCard returns 201 when created', async () => {
    vi.mocked(listsRepo.findById).mockResolvedValue({ id: 'l1', boardId: 'b1' } as never);
    vi.mocked(cardsRepo.create).mockResolvedValue({ id: 'c1', title: 'Task' } as never);
    const { res, status } = createMockResponse();

    await createCard(createMockRequest({ params: { listId: 'l1' }, body: { title: 'Task' } }), res);

    expect(status).toHaveBeenCalledWith(201);
  });

  it('updateCard returns 404 when card does not exist', async () => {
    vi.mocked(cardsRepo.update).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await updateCard(createMockRequest({ params: { id: 'c1' }, body: { title: 'x' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('updateCard returns updated card', async () => {
    vi.mocked(cardsRepo.update).mockResolvedValue({ id: 'c1', title: 'Done' } as never);
    const { res, json } = createMockResponse();

    await updateCard(createMockRequest({ params: { id: 'c1' }, body: { title: 'Done' } }), res);

    expect(json).toHaveBeenCalledWith({ id: 'c1', title: 'Done' });
  });

  it('deleteCard returns 204 when deleted', async () => {
    vi.mocked(cardsRepo.delete).mockResolvedValue(true);
    const { res, status } = createMockResponse();

    await deleteCard(createMockRequest({ params: { id: 'c1' } }), res);

    expect(status).toHaveBeenCalledWith(204);
  });

  it('deleteCard returns 404 when card is missing', async () => {
    vi.mocked(cardsRepo.delete).mockResolvedValue(false);
    const { res, status } = createMockResponse();

    await deleteCard(createMockRequest({ params: { id: 'c1' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('moveCard validates listId', async () => {
    const { res, status } = createMockResponse();

    await moveCard({ params: { id: 'c1' }, body: {} } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('moveCard returns 404 when card is missing', async () => {
    vi.mocked(cardsRepo.move).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await moveCard(createMockRequest({ params: { id: 'c1' }, body: { listId: 'l2' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('moveCard returns moved card', async () => {
    vi.mocked(cardsRepo.move).mockResolvedValue({ id: 'c1', listId: 'l2' } as never);
    const { res, json } = createMockResponse();

    await moveCard(
      createMockRequest({ params: { id: 'c1' }, body: { listId: 'l2', position: 1 } }),
      res,
    );

    expect(json).toHaveBeenCalledWith({ id: 'c1', listId: 'l2' });
  });

  it('reorderCards validates orderedIds', async () => {
    const { res, status } = createMockResponse();

    await reorderCards({ params: { listId: 'l1' }, body: {} } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('reorderCards returns reordered cards', async () => {
    vi.mocked(cardsRepo.reorder).mockResolvedValue([{ id: 'c2' }, { id: 'c1' }] as never);
    const { res, json } = createMockResponse();

    await reorderCards(
      createMockRequest({ params: { listId: 'l1' }, body: { orderedIds: ['c2', 'c1'] } }),
      res,
    );

    expect(json).toHaveBeenCalledWith([{ id: 'c2' }, { id: 'c1' }]);
  });

  it('returns 500 when repository throws', async () => {
    vi.mocked(cardsRepo.findByBoard).mockRejectedValue(new Error('db error'));
    const { res, status } = createMockResponse();

    await getCardsByBoard(createMockRequest({ params: { boardId: 'b1' } }), res);

    expect(status).toHaveBeenCalledWith(500);
  });

  // Authorization (owner-scope) tests — Phase 3
  describe('authorization (owner-scope)', () => {
    it('getCardById returns 403 when user is not the board owner', async () => {
      vi.mocked(cardsRepo.findById).mockResolvedValue({ id: 'c1' } as never);
      vi.mocked(authChecksRepo.isCardBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'c1' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await getCardById(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('getCardById returns card when user is the board owner', async () => {
      const card = { id: 'c1', title: 'Task' };
      vi.mocked(cardsRepo.findById).mockResolvedValue(card as never);
      vi.mocked(authChecksRepo.isCardBoardOwner).mockResolvedValue(true);
      vi.mocked(cardFieldValuesRepo.findByCardId).mockResolvedValue([]);

      const { res, json } = createMockResponse();
      const req = {
        params: { id: 'c1' },
        user: { id: 'user-a', email: 'a@test.com', name: 'User A', sessionId: 's1' },
      } as unknown as Request;

      await getCardById(req, res);

      expect(json).toHaveBeenCalledWith({ ...card, customFieldValues: [] });
    });

    it('updateCard returns 403 when user is not the board owner', async () => {
      vi.mocked(authChecksRepo.isCardBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'c1' },
        body: { title: 'Updated' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await updateCard(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });

    it('deleteCard returns 403 when user is not the board owner', async () => {
      vi.mocked(authChecksRepo.isCardBoardOwner).mockResolvedValue(false);

      const { res, status } = createMockResponse();
      const req = {
        params: { id: 'c1' },
        user: { id: 'other-user-id', email: 'other@test.com', name: 'Other', sessionId: 's1' },
      } as unknown as Request;

      await deleteCard(req, res);

      expect(status).toHaveBeenCalledWith(403);
    });
  });
});

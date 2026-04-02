import { getDb } from '../client';
import { boards } from '../schema';
import { boardsRepo } from './boards.repo';

vi.mock('../client', () => ({
  getDb: vi.fn(),
}));

function createOrderedSelectDb<T>(rows: T[]) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select },
    from,
    where,
    orderBy,
  };
}

function createWhereDb<T>(rows: T[]) {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select },
    from,
    where,
  };
}

describe('boards.repo owner scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAllByOwner scopes board queries by owner id and maps ownerId', async () => {
    const createdAt = new Date('2026-04-01T15:00:00.000Z');
    const updatedAt = new Date('2026-04-01T16:00:00.000Z');
    const { db, from, where, orderBy } = createOrderedSelectDb([
      {
        id: 'board-1',
        ownerId: 'user-1',
        title: 'Roadmap',
        description: 'Q2 roadmap',
        background: '#0052CC',
        createdAt,
        updatedAt,
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db as never);

    const result = await boardsRepo.findAllByOwner('user-1');

    expect(from).toHaveBeenCalledWith(boards);
    expect(where).toHaveBeenCalledTimes(1);
    expect(orderBy).toHaveBeenCalledWith(boards.createdAt);
    expect(result).toEqual([
      {
        id: 'board-1',
        ownerId: 'user-1',
        title: 'Roadmap',
        description: 'Q2 roadmap',
        background: '#0052CC',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
  });

  it('findByIdAndOwner returns null when the board does not belong to the owner scope', async () => {
    const { db, from, where } = createWhereDb([]);
    vi.mocked(getDb).mockReturnValue(db as never);

    const result = await boardsRepo.findByIdAndOwner('board-2', 'user-2');

    expect(from).toHaveBeenCalledWith(boards);
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});

import { getDb } from '../client';
import { authSessions } from '../schema';
import { authSessionsRepo } from './auth-sessions.repo';

vi.mock('../client', () => ({
  getDb: vi.fn(),
}));

function createInsertDb<T>(rows: T[]): {
  db: { insert: ReturnType<typeof vi.fn> };
  values: ReturnType<typeof vi.fn>;
} {
  const returning = vi.fn().mockResolvedValue(rows);
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));

  return {
    db: { insert },
    values,
  };
}

function createWhereDb<T>(rows: T[]): {
  db: { select: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
} {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select },
    from,
    where,
  };
}

describe('authSessions.repo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create persists a session row and maps the stored session payload', async () => {
    const createdAt = new Date('2026-04-01T12:00:00.000Z');
    const updatedAt = new Date('2026-04-01T12:00:00.000Z');
    const expiresAt = '2026-04-02T12:00:00.000Z';
    const { db, values } = createInsertDb([
      {
        id: 'session-1',
        userId: 'user-1',
        tokenId: 'token-1',
        expiresAt: new Date(expiresAt),
        revokedAt: null,
        lastUsedAt: null,
        createdAt,
        updatedAt,
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db as never);

    const result = await authSessionsRepo.create({
      userId: 'user-1',
      tokenId: 'token-1',
      expiresAt,
    });

    expect(values).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenId: 'token-1',
      expiresAt: new Date(expiresAt),
      lastUsedAt: null,
    });
    expect(result).toEqual({
      id: 'session-1',
      userId: 'user-1',
      tokenId: 'token-1',
      expiresAt,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('findByTokenId returns the persisted session for a token id', async () => {
    const createdAt = new Date('2026-04-01T13:00:00.000Z');
    const updatedAt = new Date('2026-04-01T14:00:00.000Z');
    const lastUsedAt = new Date('2026-04-01T14:30:00.000Z');
    const expiresAt = new Date('2026-04-02T13:00:00.000Z');
    const { db, from, where } = createWhereDb([
      {
        id: 'session-2',
        userId: 'user-2',
        tokenId: 'token-2',
        expiresAt,
        revokedAt: null,
        lastUsedAt,
        createdAt,
        updatedAt,
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db as never);

    const result = await authSessionsRepo.findByTokenId('token-2');

    expect(from).toHaveBeenCalledWith(authSessions);
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: 'session-2',
      userId: 'user-2',
      tokenId: 'token-2',
      expiresAt: expiresAt.toISOString(),
      revokedAt: null,
      lastUsedAt: lastUsedAt.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
});

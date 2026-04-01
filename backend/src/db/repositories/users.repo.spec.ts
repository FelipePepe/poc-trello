import { getDb } from '../client';
import { users } from '../schema';
import { usersRepo } from './users.repo';

vi.mock('../client', () => ({
  getDb: vi.fn(),
}));

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

describe('users.repo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findByEmail returns the stored auth user for a matching email', async () => {
    const createdAt = new Date('2026-04-01T10:00:00.000Z');
    const updatedAt = new Date('2026-04-01T11:00:00.000Z');
    const { db, from, where } = createWhereDb([
      {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User One',
        passwordHash: 'hash-1',
        mfaSecret: 'BASE32SECRET',
        mfaEnabled: true,
        createdAt,
        updatedAt,
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db as never);

    const result = await usersRepo.findByEmail('user@example.com');

    expect(from).toHaveBeenCalledWith(users);
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      passwordHash: 'hash-1',
      mfaSecret: 'BASE32SECRET',
      mfaEnabled: true,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('findByEmail returns null when the email is not stored', async () => {
    const { db } = createWhereDb([]);
    vi.mocked(getDb).mockReturnValue(db as never);

    const result = await usersRepo.findByEmail('missing@example.com');

    expect(result).toBeNull();
  });
});

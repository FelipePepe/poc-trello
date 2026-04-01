import type { Request } from 'express';
import { createMockResponse } from '../test-utils/http-mocks';
import {
  getFieldsByBoard,
  createField,
  updateField,
  deleteField,
  upsertFieldValue,
  deleteFieldValue,
} from './custom-fields.controller';
import { customFieldsRepo } from '../db/repositories/custom-fields.repo';
import { cardFieldValuesRepo } from '../db/repositories/card-field-values.repo';

vi.mock('../db/repositories/custom-fields.repo', () => ({
  customFieldsRepo: {
    findByBoardId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../db/repositories/card-field-values.repo', () => ({
  cardFieldValuesRepo: {
    upsert: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('custom-fields.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFieldsByBoard returns fields', async () => {
    vi.mocked(customFieldsRepo.findByBoardId).mockResolvedValue([{ id: 'f1' }] as never);
    const { res, json } = createMockResponse();

    await getFieldsByBoard({ params: { boardId: 'b1' } } as unknown as Request, res);

    expect(json).toHaveBeenCalledWith([{ id: 'f1' }]);
  });

  it('createField validates name', async () => {
    const { res, status } = createMockResponse();

    await createField(
      { params: { boardId: 'b1' }, body: { name: '', type: 'text' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
  });

  it('createField validates select options', async () => {
    const { res, status } = createMockResponse();

    await createField(
      {
        params: { boardId: 'b1' },
        body: { name: 'Priority', type: 'select', options: [] },
      } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
  });

  it('createField validates type', async () => {
    const { res, status } = createMockResponse();

    await createField(
      { params: { boardId: 'b1' }, body: { name: 'Age', type: 'invalid' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
  });

  it('createField returns 201 when valid', async () => {
    vi.mocked(customFieldsRepo.create).mockResolvedValue({ id: 'f1', name: 'Priority' } as never);
    const { res, status } = createMockResponse();

    await createField(
      { params: { boardId: 'b1' }, body: { name: 'Priority', type: 'text' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(201);
  });

  it('updateField rejects type mutation', async () => {
    const { res, status } = createMockResponse();

    await updateField(
      { params: { id: 'f1' }, body: { type: 'number' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(400);
  });

  it('deleteField returns 204 when deleted', async () => {
    vi.mocked(customFieldsRepo.remove).mockResolvedValue(true);
    const { res, status } = createMockResponse();

    await deleteField({ params: { id: 'f1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(204);
  });

  it('updateField returns 404 when field missing', async () => {
    vi.mocked(customFieldsRepo.update).mockResolvedValue(null);
    const { res, status } = createMockResponse();

    await updateField(
      { params: { id: 'f1' }, body: { name: 'New Name' } } as unknown as Request,
      res,
    );

    expect(status).toHaveBeenCalledWith(404);
  });

  it('updateField returns updated field', async () => {
    vi.mocked(customFieldsRepo.update).mockResolvedValue({ id: 'f1', name: 'New Name' } as never);
    const { res, json } = createMockResponse();

    await updateField(
      { params: { id: 'f1' }, body: { name: 'New Name' } } as unknown as Request,
      res,
    );

    expect(json).toHaveBeenCalledWith({ id: 'f1', name: 'New Name' });
  });

  it('deleteField returns 404 when field missing', async () => {
    vi.mocked(customFieldsRepo.remove).mockResolvedValue(false);
    const { res, status } = createMockResponse();

    await deleteField({ params: { id: 'f1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('upsertFieldValue deletes when value is empty', async () => {
    const { res, status } = createMockResponse();

    await upsertFieldValue(
      { params: { cardId: 'c1', fieldId: 'f1' }, body: { value: '' } } as unknown as Request,
      res,
    );

    expect(cardFieldValuesRepo.remove).toHaveBeenCalledWith('c1', 'f1');
    expect(status).toHaveBeenCalledWith(204);
  });

  it('upsertFieldValue upserts non-empty value', async () => {
    vi.mocked(cardFieldValuesRepo.upsert).mockResolvedValue({
      cardId: 'c1',
      fieldId: 'f1',
      value: 'High',
    } as never);
    const { res, json } = createMockResponse();

    await upsertFieldValue(
      { params: { cardId: 'c1', fieldId: 'f1' }, body: { value: 'High' } } as unknown as Request,
      res,
    );

    expect(json).toHaveBeenCalledWith({ cardId: 'c1', fieldId: 'f1', value: 'High' });
  });

  it('deleteFieldValue always returns 204 on success', async () => {
    const { res, status } = createMockResponse();

    await deleteFieldValue({ params: { cardId: 'c1', fieldId: 'f1' } } as unknown as Request, res);

    expect(cardFieldValuesRepo.remove).toHaveBeenCalledWith('c1', 'f1');
    expect(status).toHaveBeenCalledWith(204);
  });

  it('returns 500 when repository throws', async () => {
    vi.mocked(customFieldsRepo.findByBoardId).mockRejectedValue(new Error('db error'));
    const { res, status } = createMockResponse();

    await getFieldsByBoard({ params: { boardId: 'b1' } } as unknown as Request, res);

    expect(status).toHaveBeenCalledWith(500);
  });
});

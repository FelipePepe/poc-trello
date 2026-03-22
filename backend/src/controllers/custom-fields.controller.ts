import { Request, Response } from 'express';
import type { CreateCustomFieldDto, UpdateCustomFieldDto, UpsertCardFieldValueDto } from '../models';
import { customFieldsRepo } from '../db/repositories/custom-fields.repo';
import { cardFieldValuesRepo } from '../db/repositories/card-field-values.repo';

const VALID_TYPES = ['text', 'number', 'checkbox', 'date', 'select'] as const;
type ValidType = typeof VALID_TYPES[number];

// ─── Custom Fields (board-scoped) ─────────────────────────────────────────────

export const getFieldsByBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const fields = await customFieldsRepo.findByBoardId(req.params.boardId);
    res.json(fields);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createField = async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as CreateCustomFieldDto;
  if (!dto.name?.trim()) {
    res.status(400).json({ message: 'name is required' });
    return;
  }
  if (!VALID_TYPES.includes(dto.type as ValidType)) {
    res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
    return;
  }
  if (dto.type === 'select') {
    if (!Array.isArray(dto.options) || dto.options.length === 0) {
      res.status(400).json({ message: 'options must be a non-empty array of strings for type "select"' });
      return;
    }
    if (!dto.options.every((o) => typeof o === 'string')) {
      res.status(400).json({ message: 'options must be an array of strings' });
      return;
    }
  }
  try {
    const field = await customFieldsRepo.create(req.params.boardId, dto);
    res.status(201).json(field);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateField = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if ('type' in body) {
    res.status(400).json({ message: 'type is immutable and cannot be updated' });
    return;
  }
  const dto = body as UpdateCustomFieldDto;
  try {
    const field = await customFieldsRepo.update(req.params.id, dto);
    if (!field) {
      res.status(404).json({ message: 'Custom field not found' });
      return;
    }
    res.json(field);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteField = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await customFieldsRepo.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Custom field not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Card Field Values ────────────────────────────────────────────────────────

export const upsertFieldValue = async (req: Request, res: Response): Promise<void> => {
  const { cardId, fieldId } = req.params;
  const { value } = req.body as UpsertCardFieldValueDto;
  if (value === null || value === '') {
    try {
      await cardFieldValuesRepo.remove(cardId, fieldId);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
    return;
  }
  try {
    const fieldValue = await cardFieldValuesRepo.upsert(cardId, fieldId, { value });
    res.json(fieldValue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteFieldValue = async (req: Request, res: Response): Promise<void> => {
  const { cardId, fieldId } = req.params;
  try {
    await cardFieldValuesRepo.remove(cardId, fieldId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

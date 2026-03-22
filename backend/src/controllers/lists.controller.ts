import { Request, Response } from 'express';
import { CreateListDto, UpdateListDto } from '../models';
import { listsRepo } from '../db/repositories/lists.repo';
import { boardsRepo } from '../db/repositories/boards.repo';

export const getListsByBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const board = await boardsRepo.findById(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }
    const listsResult = await listsRepo.findByBoard(boardId);
    res.json(listsResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createList = async (req: Request, res: Response): Promise<void> => {
  const { boardId } = req.params;
  const dto = req.body as CreateListDto;
  if (!dto.title?.trim()) {
    res.status(400).json({ message: 'Title is required' });
    return;
  }
  try {
    const board = await boardsRepo.findById(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }
    const list = await listsRepo.create(boardId, dto);
    res.status(201).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateList = async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as UpdateListDto;
  try {
    const list = await listsRepo.update(req.params.id, dto);
    if (!list) {
      res.status(404).json({ message: 'List not found' });
      return;
    }
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteList = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await listsRepo.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'List not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const reorderLists = async (req: Request, res: Response): Promise<void> => {
  const { boardId } = req.params;
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ message: 'orderedIds must be an array' });
    return;
  }
  try {
    const listsResult = await listsRepo.reorder(boardId, orderedIds);
    res.json(listsResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

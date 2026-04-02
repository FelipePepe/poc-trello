import { Request, Response } from 'express';
import { CreateBoardDto, UpdateBoardDto } from '../models';
import { boardsRepo } from '../db/repositories/boards.repo';
import { authChecksRepo } from '../db/repositories/auth-checks.repo';

export const getBoards = async (_req: Request, res: Response): Promise<void> => {
  try {
    const boards = await boardsRepo.findByOwner(_req.user!.id);
    res.json(boards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBoardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const board = await boardsRepo.findById(req.params.id);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Authorization: verify user owns the board
    const isOwner = await authChecksRepo.isBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createBoard = async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as CreateBoardDto;
  if (!dto.title?.trim()) {
    res.status(400).json({ message: 'Title is required' });
    return;
  }
  try {
    const board = await boardsRepo.create(dto);
    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBoard = async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as UpdateBoardDto;
  try {
    const board = await boardsRepo.findById(req.params.id);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Authorization: verify user owns the board
    const isOwner = await authChecksRepo.isBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updatedBoard = await boardsRepo.update(req.params.id, dto);
    if (!updatedBoard) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }
    res.json(updatedBoard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const board = await boardsRepo.findById(req.params.id);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Authorization: verify user owns the board
    const isOwner = await authChecksRepo.isBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const deleted = await boardsRepo.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

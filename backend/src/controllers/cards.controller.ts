import { Request, Response } from 'express';
import { CreateCardDto, UpdateCardDto } from '../models';
import { cardsRepo } from '../db/repositories/cards.repo';
import { listsRepo } from '../db/repositories/lists.repo';
import { cardFieldValuesRepo } from '../db/repositories/card-field-values.repo';
import { authChecksRepo } from '../db/repositories/auth-checks.repo';

export const getCardsByList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listId } = req.params;
    const list = await listsRepo.findById(listId);
    if (!list) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    // Authorization: verify user owns the board containing this list
    const isOwner = await authChecksRepo.isListBoardOwner(listId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const cardsResult = await cardsRepo.findByList(listId);
    res.json(cardsResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCardsByBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;

    // Authorization: verify user owns the board
    const isOwner = await authChecksRepo.isBoardOwner(boardId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const cardsResult = await cardsRepo.findByBoard(boardId);
    res.json(cardsResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const card = await cardsRepo.findById(req.params.id);
    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Authorization: verify user owns the board containing this card
    const isOwner = await authChecksRepo.isCardBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const customFieldValues = await cardFieldValuesRepo.findByCardId(card.id);
    res.json({ ...card, customFieldValues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCard = async (req: Request, res: Response): Promise<void> => {
  const { listId } = req.params;
  const dto = req.body as CreateCardDto;
  if (!dto.title?.trim()) {
    res.status(400).json({ message: 'Title is required' });
    return;
  }
  try {
    const list = await listsRepo.findById(listId);
    if (!list) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    // Authorization: verify user owns the board containing this list
    const isOwner = await authChecksRepo.isListBoardOwner(listId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const card = await cardsRepo.create(listId, dto, list.boardId);
    res.status(201).json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCard = async (req: Request, res: Response): Promise<void> => {
  const dto = req.body as UpdateCardDto;
  try {
    // Authorization: verify user owns the board containing this card
    const isOwner = await authChecksRepo.isCardBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const card = await cardsRepo.update(req.params.id, dto);
    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Authorization: verify user owns the board containing this card
    const isOwner = await authChecksRepo.isCardBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const deleted = await cardsRepo.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const moveCard = async (req: Request, res: Response): Promise<void> => {
  const { listId, position } = req.body as { listId: string; position?: number };
  if (!listId) {
    res.status(400).json({ message: 'listId is required' });
    return;
  }
  try {
    // Authorization: verify user owns the board containing this card
    const isOwner = await authChecksRepo.isCardBoardOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const card = await cardsRepo.move(req.params.id, { listId, position });
    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const reorderCards = async (req: Request, res: Response): Promise<void> => {
  const { listId } = req.params;
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ message: 'orderedIds must be an array' });
    return;
  }
  try {
    // Authorization: verify user owns the board containing this list
    const isOwner = await authChecksRepo.isListBoardOwner(listId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const cardsResult = await cardsRepo.reorder(listId, orderedIds);
    res.json(cardsResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

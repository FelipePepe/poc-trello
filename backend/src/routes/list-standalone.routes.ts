import { Router } from 'express';
import * as ListsController from '../controllers/lists.controller';
import * as CardsController from '../controllers/cards.controller';

const router = Router();

// PATCH /api/lists/:listId/reorder-cards
router.patch('/:listId/reorder-cards', CardsController.reorderCards);

// PUT /api/lists/:id
router.put('/:id', ListsController.updateList);

// DELETE /api/lists/:id
router.delete('/:id', ListsController.deleteList);

export default router;

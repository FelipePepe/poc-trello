import { Router } from 'express';
import * as ListsController from '../controllers/lists.controller';
import * as CardsController from '../controllers/cards.controller';

const router = Router();

// PATCH /api/lists/:id/reorder-cards
router.patch('/:id/reorder-cards', (req, res) => {
  req.params.listId = req.params.id;
  CardsController.reorderCards(req, res);
});

// PUT /api/lists/:id
router.put('/:id', ListsController.updateList);

// DELETE /api/lists/:id
router.delete('/:id', ListsController.deleteList);

export default router;

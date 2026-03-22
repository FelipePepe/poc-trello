import { Router } from 'express';
import * as CardsController from '../controllers/cards.controller';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/lists/{listId}/cards:
 *   get:
 *     tags: [Cards]
 *     summary: Get all cards in a list
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cards in the list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 */
router.get('/', CardsController.getCardsByList);

/**
 * @openapi
 * /api/lists/{listId}/cards:
 *   post:
 *     tags: [Cards]
 *     summary: Create a new card in a list
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCardDto'
 *     responses:
 *       201:
 *         description: Card created
 */
router.post('/', CardsController.createCard);

/**
 * @openapi
 * /api/lists/{listId}/cards/reorder:
 *   patch:
 *     tags: [Cards]
 *     summary: Reorder cards within a list
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cards reordered
 */
router.patch('/reorder', CardsController.reorderCards);

export default router;

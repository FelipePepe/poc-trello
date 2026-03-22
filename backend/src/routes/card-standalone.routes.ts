import { Router } from 'express';
import * as CardsController from '../controllers/cards.controller';

const router = Router();

/**
 * @openapi
 * /api/cards/{id}:
 *   get:
 *     tags: [Cards]
 *     summary: Get card by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Card found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       404:
 *         description: Card not found
 */
router.get('/:id', CardsController.getCardById);

/**
 * @openapi
 * /api/cards/{id}:
 *   put:
 *     tags: [Cards]
 *     summary: Update a card
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCardDto'
 *     responses:
 *       200:
 *         description: Card updated
 *       404:
 *         description: Card not found
 */
router.put('/:id', CardsController.updateCard);

/**
 * @openapi
 * /api/cards/{id}:
 *   delete:
 *     tags: [Cards]
 *     summary: Delete a card
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Card deleted
 *       404:
 *         description: Card not found
 */
router.delete('/:id', CardsController.deleteCard);

/**
 * @openapi
 * /api/cards/{id}/move:
 *   patch:
 *     tags: [Cards]
 *     summary: Move a card to another list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listId, position]
 *             properties:
 *               listId:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Card moved
 *       404:
 *         description: Card or target list not found
 */
router.patch('/:id/move', CardsController.moveCard);

export default router;

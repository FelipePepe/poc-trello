import { Router } from 'express';
import * as ListsController from '../controllers/lists.controller';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/boards/{boardId}/lists:
 *   get:
 *     tags: [Lists]
 *     summary: Get all lists for a board
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lists for the board
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoardList'
 *       404:
 *         description: Board not found
 */
router.get('/', ListsController.getListsByBoard);

/**
 * @openapi
 * /api/boards/{boardId}/lists:
 *   post:
 *     tags: [Lists]
 *     summary: Create a new list in a board
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListDto'
 *     responses:
 *       201:
 *         description: List created
 *       404:
 *         description: Board not found
 */
router.post('/', ListsController.createList);

/**
 * @openapi
 * /api/boards/{boardId}/lists/reorder:
 *   patch:
 *     tags: [Lists]
 *     summary: Reorder lists in a board
 *     parameters:
 *       - in: path
 *         name: boardId
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
 *         description: Lists reordered
 */
router.patch('/reorder', ListsController.reorderLists);

/**
 * @openapi
 * /api/lists/{id}:
 *   put:
 *     tags: [Lists]
 *     summary: Update a list
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
 *             $ref: '#/components/schemas/UpdateListDto'
 *     responses:
 *       200:
 *         description: List updated
 *       404:
 *         description: List not found
 */

/**
 * @openapi
 * /api/lists/{id}:
 *   delete:
 *     tags: [Lists]
 *     summary: Delete a list (cascades cards)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: List deleted
 *       404:
 *         description: List not found
 */

export default router;

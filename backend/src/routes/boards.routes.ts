import { Router } from 'express';
import * as BoardsController from '../controllers/boards.controller';

const router = Router();

/**
 * @openapi
 * /api/boards:
 *   get:
 *     tags: [Boards]
 *     summary: Get all boards
 *     responses:
 *       200:
 *         description: List of boards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Board'
 */
router.get('/', BoardsController.getBoards);

/**
 * @openapi
 * /api/boards/{id}:
 *   get:
 *     tags: [Boards]
 *     summary: Get board by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       404:
 *         description: Board not found
 */
router.get('/:id', BoardsController.getBoardById);

/**
 * @openapi
 * /api/boards:
 *   post:
 *     tags: [Boards]
 *     summary: Create a new board
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBoardDto'
 *     responses:
 *       201:
 *         description: Board created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 */
router.post('/', BoardsController.createBoard);

/**
 * @openapi
 * /api/boards/{id}:
 *   put:
 *     tags: [Boards]
 *     summary: Update a board
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
 *             $ref: '#/components/schemas/UpdateBoardDto'
 *     responses:
 *       200:
 *         description: Board updated
 *       404:
 *         description: Board not found
 */
router.put('/:id', BoardsController.updateBoard);

/**
 * @openapi
 * /api/boards/{id}:
 *   delete:
 *     tags: [Boards]
 *     summary: Delete a board (cascades lists & cards)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Board deleted
 *       404:
 *         description: Board not found
 */
router.delete('/:id', BoardsController.deleteBoard);

export default router;

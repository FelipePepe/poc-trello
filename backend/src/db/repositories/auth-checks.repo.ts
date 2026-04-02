import { boardsRepo } from './boards.repo';
import { listsRepo } from './lists.repo';
import { cardsRepo } from './cards.repo';
import { customFieldsRepo } from './custom-fields.repo';

/**
 * Authorization check utilities for multi-user scope verification.
 * Verifies that a user has ownership/access to a resource before allowing operations.
 */

export const authChecksRepo = {
  /**
   * Verify user is the owner of a board
   */
  async isBoardOwner(boardId: string, userId: string): Promise<boolean> {
    const board = await boardsRepo.findById(boardId);
    return board?.ownerId === userId;
  },

  /**
   * Verify user is the owner of the board that contains a list
   */
  async isListBoardOwner(listId: string, userId: string): Promise<boolean> {
    const list = await listsRepo.findById(listId);
    if (!list) return false;
    return authChecksRepo.isBoardOwner(list.boardId, userId);
  },

  /**
   * Verify user is the owner of the board that contains a card
   */
  async isCardBoardOwner(cardId: string, userId: string): Promise<boolean> {
    const card = await cardsRepo.findById(cardId);
    if (!card) return false;

    const list = await listsRepo.findById(card.listId);
    if (!list) return false;

    return authChecksRepo.isBoardOwner(list.boardId, userId);
  },

  /**
   * Verify user is the owner of the board for a custom field
   */
  async isCustomFieldBoardOwner(fieldId: string, userId: string): Promise<boolean> {
    const field = await customFieldsRepo.findById(fieldId);
    if (!field) return false;
    return authChecksRepo.isBoardOwner(field.boardId, userId);
  },
};

import { Router } from 'express';
import * as CustomFieldsController from '../controllers/custom-fields.controller';

const router = Router();

router.put('/:id', CustomFieldsController.updateField);
router.delete('/:id', CustomFieldsController.deleteField);

export default router;

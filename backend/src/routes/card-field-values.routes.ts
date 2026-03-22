import { Router } from 'express';
import * as CustomFieldsController from '../controllers/custom-fields.controller';

const router = Router({ mergeParams: true });

router.put('/:fieldId', CustomFieldsController.upsertFieldValue);
router.delete('/:fieldId', CustomFieldsController.deleteFieldValue);

export default router;

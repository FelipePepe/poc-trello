import { Router } from 'express';
import * as CustomFieldsController from '../controllers/custom-fields.controller';

const router = Router({ mergeParams: true });

router.get('/', CustomFieldsController.getFieldsByBoard);
router.post('/', CustomFieldsController.createField);

export default router;

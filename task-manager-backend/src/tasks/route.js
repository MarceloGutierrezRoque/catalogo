import express from 'express';
import TaskController from './controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, TaskController.getAll);
router.post('/', authMiddleware, TaskController.create);
router.get('/:id', authMiddleware, TaskController.getById);
router.put('/:id', authMiddleware, TaskController.update);
router.delete('/:id', authMiddleware, TaskController.delete);

export default router;
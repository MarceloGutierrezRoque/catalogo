import express from 'express';
import UserController from './controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/profile', authMiddleware, UserController.getProfile);

export default router;
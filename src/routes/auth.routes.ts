import express from 'express';
import { adminAuth, courierAuth } from '../middleware/authMiddleware';

const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/admin/createCourier', adminAuth, authController.registerCourier);
router.post('/login', authController.loginCourier);
router.post('/admin/login', authController.loginAdmin);

router.get('/me', courierAuth, authController.getCurrentCourier);

export default router;

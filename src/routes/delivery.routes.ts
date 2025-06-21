import express from 'express';

import { upload } from '../middleware/upload';
import { courierAuth, adminAuth } from '../middleware/authMiddleware';

const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const parcelController = require('../controllers/parcel.controller');

router.get('/all', adminAuth, deliveryController.getAllDeliveries);
router.get('/', courierAuth, deliveryController.getCourierDeliveries);
router.get('/id/:id', courierAuth, deliveryController.getDeliveryById);
router.get('/parcel/:id', adminAuth, parcelController.getAllParcelsInDelivery);

router.post('/', adminAuth, deliveryController.createDelivery);
router.post('/parcel/:id', adminAuth, parcelController.addParcelToDelivery);

router.put('/:id', adminAuth, deliveryController.updateDelivery);
router.put('/:id/deliver', courierAuth, upload.single('image'), deliveryController.deliver);
router.put('parcel/:deliveryId/:parcelId', adminAuth, parcelController.editParcelInDelivery);

router.delete('/:id', adminAuth, deliveryController.deleteDelivery);
router.delete('parcel/:deliveryId/:parcelId', adminAuth, parcelController.removeParcelFromDelivery);

export default router;

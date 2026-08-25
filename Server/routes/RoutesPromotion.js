const express = require('express');
const router = express.Router();
const controller = require('../controllers/ControllerPromotion');
const ControllerJWT = require('../jwt/ControllerJWT');

// Public routes
router.get('/code', controller.GetPromotionByCode);
router.post('/validate', controller.ValidatePromotion);
router.post('/apply', controller.ApplyPromotion);
router.get('/active', controller.GetActivePromotions);

// Admin routes (require authentication)
router.get('/all', ControllerJWT.verifyTokenAdmin, controller.GetAllPromotions);
router.get('/', ControllerJWT.verifyTokenAdmin, controller.GetPromotionById);
router.get('/usage-history', ControllerJWT.verifyTokenAdmin, controller.GetPromotionUsageHistory);
router.post('/create', ControllerJWT.verifyTokenAdmin, controller.CreatePromotion);
router.put('/update', ControllerJWT.verifyTokenAdmin, controller.UpdatePromotion);
router.delete('/delete', ControllerJWT.verifyTokenAdmin, controller.DeletePromotion);
router.post('/toggle-status', ControllerJWT.verifyTokenAdmin, controller.TogglePromotionStatus);

module.exports = router;

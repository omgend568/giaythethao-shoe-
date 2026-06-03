const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/auth', authMiddleware.verifyToken, authController.auth);
router.post('/logout', authMiddleware.verifyToken, authController.logout);
router.get('/refresh-token', authController.refreshToken);

module.exports = router;

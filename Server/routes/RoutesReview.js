const express = require('express');
const router = express.Router();
const controller = require('../controllers/ControllerReview');
const ControllerJWT = require('../jwt/ControllerJWT');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, 'review-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif)'));
    },
});

router.get('/order-item-id', ControllerJWT.verifyToken, controller.GetOrderItemId);
router.post('/create', ControllerJWT.verifyToken, upload.array('images'), controller.CreateReview);
router.get('/product', controller.GetProductReviews);
router.get('/review', controller.GetReviewById);
router.get('/user', ControllerJWT.verifyToken, controller.GetUserReviews);
router.put('/update', ControllerJWT.verifyToken, upload.array('images'), controller.UpdateReview);
router.put('/hide', ControllerJWT.verifyTokenAdmin, controller.HideReview);
router.put('/unhide', ControllerJWT.verifyTokenAdmin, controller.UnhideReview);
router.delete('/delete', ControllerJWT.verifyTokenAdmin, controller.DeleteReview);
router.get('/stats', controller.GetReviewStats);
router.get('/all', controller.GetAllReviews);

module.exports = router;

const express = require('express');
const router = express.Router();

const ControllerCart = require('../controllers/ControllerCart');
const ControllerJWT = require('../jwt/ControllerJWT');

router.post('/addtocart', ControllerJWT.verifyToken, ControllerCart.AddToCart);
router.post('/deletecart', ControllerJWT.verifyToken, ControllerCart.DeleteCart);
router.post('/updatecart', ControllerJWT.verifyToken, ControllerCart.UpdateCartItem);
router.get('/cart', ControllerJWT.verifyToken, ControllerCart.GetCart);
router.post('/update-info-cart', ControllerJWT.verifyToken, ControllerCart.updateInfoCart);

module.exports = router;

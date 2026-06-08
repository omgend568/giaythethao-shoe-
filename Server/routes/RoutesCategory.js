const express = require('express');
const router = express.Router();

const controller = require('../controllers/ControllerCategory');
const ControllerJWT = require('../jwt/ControllerJWT');

router.post('/seed-brands', controller.seedBrands);
router.get('/brands', controller.getBrands);
router.get('/categories', controller.getCategories);
router.get('/all-categories', controller.getAllCategoriesWithBrand);
router.post('/add-category', ControllerJWT.verifyTokenAdmin, controller.addCategory);
router.post('/edit-category', ControllerJWT.verifyTokenAdmin, controller.editCategory);
router.delete('/delete-category', ControllerJWT.verifyTokenAdmin, controller.deleteCategory);

module.exports = router;

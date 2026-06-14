const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const controller = require('../controllers/ControllerProduct');
const ControllerJWT = require('../jwt/ControllerJWT');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const fileCount = req.files ? req.files.length : 0;
        if (fileCount >= 10) {
            return cb(new Error('Tối đa 10 ảnh'), false);
        }
        cb(null, true);
    },
});

router.post('/addproduct', ControllerJWT.verifyTokenAdmin, upload.array('fileImg'), controller.AddProducts);
router.get('/products', controller.GetProducts);
router.get('/product', controller.GetOneProducts);
router.get('/search', controller.SearchProduct);
router.post('/editpro', ControllerJWT.verifyTokenAdmin, upload.array('fileImg'), controller.EditPro);
router.delete('/deleteproduct', ControllerJWT.verifyTokenAdmin, controller.deletePro);
router.get('/similarproduct', controller.SimilarProduct);

module.exports = router;

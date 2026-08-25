const express = require('express');
const router = express.Router();
const ControllerStatistics = require('../controllers/ControllerStatistics');
const { jwtDecode } = require('jwt-decode');
const modelUser = require('../models/ModelUser');

// Middleware to check admin authentication
const checkAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.Token;
        if (!token) {
            return res.status(401).json({ message: 'Không có token' });
        }
        const decoded = jwtDecode(token);
        const findUser = await modelUser.findOne({ where: { email: decoded.email } });
        if (!findUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        if (findUser.isAdmin !== true) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
        }
        req.user = findUser;
        next();
    } catch (error) {
        console.error('Error in checkAdmin:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
};

// Thống kê tổng quan
router.get('/statistics/overview', checkAdmin, ControllerStatistics.getOverview);

// Thống kê theo Brand (Giày Nam, Giày Nữ, Giày Trẻ Em)
router.get('/statistics/by-brand', checkAdmin, ControllerStatistics.getSalesByBrand);

// Thống kê chi tiết sản phẩm đã bán
router.get('/statistics/sold-products', checkAdmin, ControllerStatistics.getSoldProducts);

// Thống kê theo ngày
router.get('/statistics/by-date', checkAdmin, ControllerStatistics.getSalesByDate);

// Thống kê chi tiết theo Brand
router.get('/statistics/brand-detail', checkAdmin, ControllerStatistics.getBrandDetail);

module.exports = router;

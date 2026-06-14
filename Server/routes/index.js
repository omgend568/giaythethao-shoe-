const UserRoute = require('./RoutesUser');
const CategoryRoute = require('./RoutesCategory');
const ProductsRoute = require('./RoutesProducts');
const modelUser = require('../models/ModelUser');
const { jwtDecode } = require('jwt-decode');

function route(app) {
    app.use('/api', ProductsRoute);
    app.use('/api', UserRoute);
    app.use('/api', CategoryRoute);

    app.get('/api/admin', async (req, res) => {
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
            if (findUser.isAdmin === true) {
                return res.status(200).json({ message: 'Bạn có quyền truy cập', isAdmin: true });
            }
            return res.status(403).json({ message: 'Bạn không có quyền truy cập', isAdmin: false });
        } catch (error) {
            console.error('Error in /api/admin:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    });
}

module.exports = route;

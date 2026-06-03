const jwt = require('jsonwebtoken');

const authMiddleware = {
    verifyToken: (req, res, next) => {
        try {
            const token = req.cookies.Token;

            if (!token) {
                return res.status(401).json({ message: 'Bạn Cần Đăng Nhập Lại !!!' });
            }

            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) {
                    return res.status(403).json({ message: 'Bạn Cần Đăng Nhập Lại !!!' });
                }
                req.user = user;
                next();
            });
        } catch (error) {
            console.log('VerifyToken Error:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    },
};

module.exports = authMiddleware;

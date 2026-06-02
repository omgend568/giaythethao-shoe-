const jwt = require('jsonwebtoken');

const authMiddleware = {
    verifyToken: (req, res, next) => {
        try {
            const token = req.cookies.Token;

            if (!token) {
                return res.status(401).json('Bạn Cần Đăng Nhập Lại !!!');
            }

            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) {
                    console.log('JWT Error:', err.message);
                    return res.status(403).json('Bạn Cần Đăng Nhập Lại !!!');
                }
                req.user = user;
                next();
            });
        } catch (error) {
            console.log('VerifyToken Error:', error);
        }
    },
};

module.exports = authMiddleware;

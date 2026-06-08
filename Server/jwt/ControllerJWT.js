const jwt = require('jsonwebtoken');

const { jwtDecode } = require('jwt-decode');

const modelUser = require('../models/ModelUser');

const middlewareController = {
    verifyToken: (req, res, next) => {
        try {
            const token = req.cookies.Token;
            
            
            if (!token) {
                return res.status(401).json('Bạn Cần Đăng Nhập Lại !!!');
            }

            if (token) {
                jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                    if (err) {
                        console.log('JWT Error:', err.message);
                        return res.status(403).json('Bạn Cần Đăng Nhập Lại !!!');
                    }
                    req.user = user;
                    next();
                });
            } else {
                res.status(401).json('Bạn Cần Đăng Nhập Lại !!!');
            }
        } catch (error) {
            console.log('VerifyToken Error:', error);
        }
    },
    verifyTokenAdmin: (req, res, next) => {
        try {
            middlewareController.verifyToken(req, res, async () => {
                const findUser = await modelUser.findOne({ where: { email: req.user.email } });
                if (findUser.isAdmin === true) {
                    next();
                } else {
                    res.status(403).json({ message: 'Bạn Không Có Quyền Thao Tác !!!' });
                }
            });
        } catch (error) {
            console.log(error);
        }
    },
};

module.exports = middlewareController;

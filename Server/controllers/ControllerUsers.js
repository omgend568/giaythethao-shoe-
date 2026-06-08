const User = require('../models/ModelUser');
const Payment = require('../models/ModelPayment');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');
const { OAuth2Client } = require('google-auth-library');
const ForgotPassword = require('../SendMail/ForgotPassword');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
};

function setAuthCookies(res, user) {
    const { email } = user;
    const admin = user.isAdmin;
    const token = jwt.sign({ email, admin }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });
    const refreshToken = jwt.sign({ email, admin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie('Token', token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('logged', 1, {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

class ControllerUser {
    async Register(req, res) {
        const { fullname, password, email, phone } = req.body;
        const saltRounds = 10;
        try {
            const dataUser = await User.findOne({ where: { email } });
            if (dataUser) {
                return res.status(403).json({ message: 'Người Dùng Đã Tồn Tại !!!' });
            } else {
                const hash = await bcrypt.hash(password, saltRounds);
                await User.create({
                    fullname,
                    password: hash,
                    email,
                    phone,
                });
                return res.status(200).json({ message: 'Đăng Ký Thành Công !!!' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi !!!' });
        }
    }

    async Login(req, res, next) {
        try {
            const { password, email } = req.body;
            const dataUser = await User.findOne({ where: { email } });
            if (!dataUser) {
                return res.status(401).json({ message: 'Email Hoặc Mật Không Chính Xác !!!' });
            }
            if (!dataUser.password) {
                return res.status(401).json({
                    message: 'Tài khoản này đăng ký bằng Google. Vui lòng đăng nhập bằng Google.',
                });
            }
            const match = await bcrypt.compare(password, dataUser.password);
            if (match) {
                setAuthCookies(res, dataUser);
                return res.status(200).json({ message: 'Đăng Nhập Thành Công !!!' });
            } else {
                return res.status(401).json({ message: 'Email Hoặc Mật Khẩu Không Chính Xác !!!' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async GoogleLogin(req, res) {
        try {
            const { credential } = req.body;

            if (!credential) {
                return res.status(400).json({ message: 'Thiếu token Google' });
            }

            if (!process.env.GOOGLE_CLIENT_ID) {
                return res.status(500).json({ message: 'Chưa cấu hình GOOGLE_CLIENT_ID trên server' });
            }

            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const googleId = payload.sub;
            const email = payload.email;
            const fullname = payload.name || email.split('@')[0];

            if (!email) {
                return res.status(400).json({ message: 'Không lấy được email từ Google' });
            }

            let dataUser = await User.findOne({ where: { email } });

            if (!dataUser) {
                dataUser = await User.findOne({ where: { googleId } });
            }

            if (dataUser) {
                if (!dataUser.googleId) {
                    await dataUser.update({ googleId });
                }
            } else {
                dataUser = await User.create({
                    fullname,
                    email,
                    googleId,
                    password: null,
                    phone: '',
                });
            }

            setAuthCookies(res, dataUser);
            return res.status(200).json({ message: 'Đăng Nhập Google Thành Công !!!' });
        } catch (error) {
            console.error('GoogleLogin error:', error);
            const detail =
                process.env.NODE_ENV === 'development'
                    ? error.message || String(error)
                    : 'Đăng nhập Google không hợp lệ';
            return res.status(401).json({ message: detail });
        }
    }

    async GetUser(req, res) {
        try {
            const token = req.cookies;
            const decoded = jwtDecode(token.Token);
            if (decoded) {
                const dataUser = await User.findOne({ where: { email: decoded.email } });
                return res.status(200).json(dataUser);
            } else {
                return res.status(401).json({ message: 'Có Lỗi Xảy Ra !!!' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async Logout(req, res) {
        res.clearCookie('Token');
        res.clearCookie('logged');
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Đăng Xuất Thành Công !!!' });
    }

    async GetOrder(req, res) {
        try {
            const data = await Payment.findAll();
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async ForgotPassword(req, res) {
        try {
            const dataUser = await User.findOne({ where: { email: req.body.email } });
            if (!dataUser) {
                return res.status(404).json({ message: 'Không Tìm Thấy Người Dùng !!!' });
            }
            const SECRET_KEY = process.env.JWT_SECRET;
            const OTP_EXPRIRY = '15m';
            const email = req.body.email;

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const token = jwt.sign({ email, otp }, SECRET_KEY, { expiresIn: OTP_EXPRIRY });
            ForgotPassword(email, token, otp);
            return res.status(200).json({ message: 'Thành Công !!!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async ResetPassword(req, res) {
        try {
            const SECRET_KEY = process.env.JWT_SECRET;
            const { token, otp, newPassword } = req.body;

            const hashPassword = await bcrypt.hash(newPassword, 10);
            const decoded = jwt.verify(token, SECRET_KEY);

            if (decoded.otp === otp) {
                await User.update({ password: hashPassword }, { where: { email: decoded.email } });
                return res.status(200).json({ message: 'Khôi phục mật khẩu thành công !!!' });
            } else {
                return res.status(401).json({ message: 'Bạn Cần Xem Lại Thông Tin ' });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    async getAllUser(req, res) {
        try {
            const data = await User.findAll();
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async DeleteUser(req, res) {
        try {
            const { id } = req.query;
            const token = req.cookies;
            const decoded = jwtDecode(token.Token);
            
            // Kiểm tra user hiện tại
            const currentUser = await User.findOne({ where: { email: decoded.email } });
            if (currentUser.id === parseInt(id)) {
                return res.status(400).json({ message: 'Không thể xóa chính mình !!!' });
            }
            
            // Kiểm tra user muốn xóa
            const findUser = await User.findOne({ where: { id } });
            if (!findUser) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }
            if (findUser.isAdmin === true) {
                return res.status(400).json({ message: 'Không thể xóa Admin !!!' });
            }
            
            await findUser.destroy();
            return res.status(200).json({ message: 'Xóa Người Dùng Thành Công !!!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async RefreshToken(req, res) {
        try {
            const token = req.cookies;
            const decoded = jwtDecode(token.refreshToken);
            const newToken = jwt.sign({ email: decoded.email, admin: decoded.admin }, process.env.JWT_SECRET, {
                expiresIn: process.env.EXPIRES_IN,
            });
            return res.setHeader('Set-Cookie', `Token=${newToken}  ; max-age=360000 ;path=/`).json({
                message: 'Đăng Nhập Thành Công !!!',
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerUser();

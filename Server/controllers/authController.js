const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

class AuthController {
    async register(req, res) {
        const { fullname, password, email, phone } = req.body;
        const saltRounds = 10;

        try {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(403).json({ message: 'Người Dùng Đã Tồn Tại !!!' });
            }

            const hash = await bcrypt.hash(password, saltRounds);
            await User.create({
                fullname,
                password: hash,
                email,
                phone,
            });

            return res.status(200).json({ message: 'Đăng Ký Thành Công !!!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi !!!' });
        }
    }

    async login(req, res) {
        try {
            const { password, email } = req.body;
            const dataUser = await User.findOne({ where: { email } });

            if (!dataUser) {
                return res.status(401).json({ message: 'Email Hoặc Mật Khẩu Không Chính Xác !!!' });
            }

            const match = await bcrypt.compare(password, dataUser.password);
            if (!match) {
                return res.status(401).json({ message: 'Email Hoặc Mật Khẩu Không Chính Xác !!!' });
            }

            const admin = dataUser.isAdmin;
            const token = jwt.sign({ email, admin }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN || '15m' });
            const refreshToken = jwt.sign({ email, admin }, process.env.JWT_SECRET, { expiresIn: '30d' });

            res.cookie('Token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });

            res.cookie('logged', 1, {
                httpOnly: false,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({ message: 'Đăng Nhập Thành Công !!!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async auth(req, res) {
        try {
            const user = req.user;
            const dataUser = await User.findOne({ where: { email: user.email } });
            if (!dataUser) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }
            return res.status(200).json(dataUser);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async logout(req, res) {
        res.clearCookie('Token');
        res.clearCookie('logged');
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Đăng Xuất Thành Công !!!' });
    }

    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ message: 'Không có refresh token' });
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            const newToken = jwt.sign(
                { email: decoded.email, admin: decoded.admin },
                process.env.JWT_SECRET,
                { expiresIn: process.env.EXPIRES_IN || '15m' }
            );

            res.cookie('Token', newToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });

            return res.status(200).json({ message: 'Refresh token thành công' });
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Refresh token không hợp lệ' });
        }
    }
}

module.exports = new AuthController();

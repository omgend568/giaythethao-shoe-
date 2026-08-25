import classNames from 'classnames/bind';
import styles from '../Styles/ForgotPassword.module.scss';
import request from '../Config/api';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';

const cx = classNames.bind(styles);

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + mật khẩu
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    // Countdown timer
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Vui lòng nhập email!');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            toast.error('Email không hợp lệ!');
            return;
        }

        const pattern = /[A-Z]/;
        if (pattern.test(email)) {
            toast.error('Email không được chứa chữ in hoa!');
            return;
        }

        setLoading(true);
        try {
            const res = await request.post('/api/forgotpassword', { email });
            toast.success(res.data.message || 'Mã OTP đã được gửi đến email của bạn!');
            
            // Lưu token vào localStorage để dùng khi reset password
            if (res.data.token) {
                localStorage.setItem('resetToken', res.data.token);
            }
            
            setStep(2); // Chuyển sang bước nhập OTP
            setCountdown(120); // Bắt đầu countdown
        } catch (error) {
            const message = error?.response?.data?.message || 'Không tìm thấy tài khoản với email này!';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!otp) {
            toast.error('Vui lòng nhập mã OTP!');
            return;
        }

        if (otp.length !== 6) {
            toast.error('Mã OTP phải có 6 chữ số!');
            return;
        }

        if (!newPassword) {
            toast.error('Vui lòng nhập mật khẩu mới!');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        setLoading(true);
        try {
            // Lấy token từ localStorage
            const storedToken = localStorage.getItem('resetToken');
            
            if (!storedToken) {
                toast.error('Token đã hết hạn. Vui lòng gửi lại mã OTP.');
                setStep(1);
                return;
            }

            const res = await request.post('/api/resetpassword', {
                token: storedToken,
                otp: otp,
                newPassword: newPassword,
            });
            toast.success(res.data.message || 'Đặt lại mật khẩu thành công!');
            // Clear stored token
            localStorage.removeItem('resetToken');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error) {
            const message = error?.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToEmail = () => {
        setStep(1);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        if (!email) {
            toast.error('Email không được tìm thấy.');
            return;
        }

        setLoading(true);
        try {
            const res = await request.post('/api/forgotpassword', { email });
            toast.success(res.data.message || 'Mã OTP mới đã được gửi đến email!');
            
            // Cập nhật token mới từ response
            if (res.data.token) {
                localStorage.setItem('resetToken', res.data.token);
            }
            
            setCountdown(60);
            setOtp('');
        } catch (error) {
            const message = error?.response?.data?.message || 'Không thể gửi lại mã OTP!';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={cx('body-wrapper')}>
                <ToastContainer />
                <div className={cx('wrapper')}>
                    <div className={cx('inner')}>
                        <div className={cx('header-form')}>
                            <h1>{step === 1 ? 'Quên mật khẩu' : 'Nhập mã OTP'}</h1>
                            <p>
                                {step === 1 
                                    ? 'Nhập email để nhận mã OTP khôi phục mật khẩu'
                                    : 'Nhập mã OTP đã gửi đến email của bạn'
                                }
                            </p>
                        </div>

                        {step === 1 ? (
                            <form onSubmit={handleSendOTP}>
                                <div className={cx('form-input')}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <button type="submit" className={cx('btn-submit')} disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <div className={cx('form-input')}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        style={{ backgroundColor: '#f0f0f0' }}
                                    />
                                </div>

                                <div className={cx('form-input')}>
                                    <label>Mã OTP</label>
                                    <div className={cx('otp-wrapper')}>
                                        <input
                                            type="text"
                                            placeholder="Nhập mã OTP 6 chữ số"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6}
                                        />
                                        <button
                                            type="button"
                                            className={cx('btn-resend')}
                                            onClick={handleResendOTP}
                                            disabled={countdown > 0 || loading}
                                        >
                                            {countdown > 0 ? formatTime(countdown) : 'Gửi lại'}
                                        </button>
                                    </div>
                                </div>

                                <div className={cx('form-input')}>
                                    <label>Mật khẩu mới</label>
                                    <div className={cx('password-wrapper')}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Nhập mật khẩu mới"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className={cx('btn-toggle-password')}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>

                                <div className={cx('form-input')}>
                                    <label>Xác nhận mật khẩu</label>
                                    <div className={cx('password-wrapper')}>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Nhập lại mật khẩu mới"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className={cx('btn-toggle-password')}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className={cx('btn-submit')} disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </button>

                                <button
                                    type="button"
                                    className={cx('btn-back')}
                                    onClick={handleBackToEmail}
                                    style={{ marginTop: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
                                >
                                    ← Quay lại nhập email
                                </button>
                            </form>
                        )}

                        <div className={cx('footer-link')}>
                            <p>
                                Quay lại{' '}
                                <Link to="/login">Đăng nhập</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ForgotPassword;

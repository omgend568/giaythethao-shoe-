import classNames from 'classnames/bind';
import styles from '../Styles/ForgotPassword.module.scss';
import request from '../Config/api';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const cx = classNames.bind(styles);

function SetNewPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Lấy token từ URL query parameter
        const urlToken = searchParams.get('token');
        
        if (urlToken) {
            setToken(urlToken);
            // Decode token để lấy email (token được tạo với payload { email, otp })
            try {
                const decoded = jwtDecode(urlToken);
                if (decoded.email) {
                    setEmail(decoded.email);
                }
            } catch (err) {
                console.error('Không decode được token:', err);
            }
        }
        // Không redirect nữa - cho phép user ở lại trang và nhập email/OTP thủ công
    }, [searchParams]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        if (!email) {
            toast.error('Email không được tìm thấy. Vui lòng click link từ email mới.');
            return;
        }

        setLoading(true);
        try {
            const res = await request.post('/api/forgotpassword', { email });
            toast.success(res.data.message || 'Mã OTP mới đã được gửi đến email!');
            
            // Cập nhật token mới từ response
            if (res.data.token) {
                setToken(res.data.token);
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

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Token không hợp lệ. Vui lòng click link từ email!');
            return;
        }

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
            const res = await request.post('/api/resetpassword', {
                token: token,
                otp: otp,
                newPassword: newPassword,
            });

            toast.success(res.data.message || 'Đặt lại mật khẩu thành công!');

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

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <div className={cx('body-wrapper')}>
                <ToastContainer />
                <div className={cx('wrapper')}>
                    <div className={cx('inner-reset-password')}>
                        <div className={cx('header-form')}>
                            <h1>Đặt lại mật khẩu</h1>
                            <p>Nhập mã OTP và mật khẩu mới</p>
                        </div>

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
                                        onChange={handleOtpChange}
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
                        </form>

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

export default SetNewPassword;

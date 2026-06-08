import classNames from 'classnames/bind';
import styles from '../Styles/Login.module.scss';
import request from '../Config/api';
import { GOOGLE_CLIENT_ID } from '../Config/googleAuth';

import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

const cx = classNames.bind(styles);

function LoginUser() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const redirectAfterLogin = async () => {
        try {
            const userRes = await request.get('/api/auth');
            const user = userRes.data;
            if (user?.isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
            window.location.reload();
        } catch (error) {
            console.error('Error fetching user info:', error);
            navigate('/');
            window.location.reload();
        }
    };

    const handleLoginUser = async () => {
        try {
            if (!email || !password) {
                toast.error('Vui lòng nhập đầy đủ email và mật khẩu!');
                return;
            }

            const pattern = /[A-Z]/;
            if (pattern.test(email)) {
                toast.error('Email không được chứa chữ in hoa!');
                return;
            }

            const res = await request.post('/api/login', {
                email,
                password,
            });

            toast.success(res.data.message || 'Đăng nhập thành công!');

            setTimeout(() => {
                redirectAfterLogin();
            }, 1000);
        } catch (error) {
            const message = error?.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
            toast.error(message);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            if (!credentialResponse?.credential) {
                toast.error('Không nhận được token từ Google');
                return;
            }

            const res = await request.post('/api/auth/google', {
                credential: credentialResponse.credential,
            });

            toast.success(res.data.message || 'Đăng nhập Google thành công!');

            setTimeout(() => {
                redirectAfterLogin();
            }, 500);
        } catch (error) {
            console.error('Google API error:', error?.response?.data || error.message);
            let message = error?.response?.data?.message;
            if (!message && error.code === 'ERR_NETWORK') {
                message = 'Không kết nối được Server. Kiểm tra npm start trong folder Server (port 5001).';
            }
            toast.error(message || 'Server từ chối đăng nhập Google. Xem terminal Server để biết chi tiết.');
        }
    };

    const handleGoogleError = () => {
        console.error('Google popup onError — popup bị đóng, chặn cookie, hoặc cấu hình OAuth chưa đúng.');
        toast.error('Popup Google lỗi. Kiểm tra origins http://localhost:3000 trên Google Cloud.');
    };

    return (
        <>
            <div className={cx('body-wrapper')}>
                <ToastContainer />
                <div className={cx('wrapper')}>
                    <div className={cx('inner')}>
                        <div className={cx('header-form-login')}>
                            <span>Đăng nhập</span>
                            <p>Vui lòng đăng nhập để nhận thêm nhiều ưu đãi</p>
                        </div>
                        <div className={cx('input-box')}>
                            <div className={cx('form-input')}>
                                <label>Tên tài khoản hoặc Email đăng nhập</label>
                                <input
                                    placeholder="Nhập Tài Khoản / Email"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className={cx('form-input')}>
                                <label>Mật khẩu</label>
                                <input
                                    placeholder="Nhập Mật Khẩu"
                                    type="password"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button className={cx('btn-login')} onClick={handleLoginUser}>
                                Đăng nhập
                            </button>

                            <p className={cx('divider')}>hoặc</p>

                            <div className={cx('google-login-wrap')}>
                                {GOOGLE_CLIENT_ID ? (
                                    <GoogleLogin
                                        type="icon"
                                        shape="circle"
                                        theme="filled_black"
                                        size="large"
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                    />
                                ) : (
                                    <p style={{ color: 'red', fontSize: 14 }}>
                                    </p>
                                )}
                            </div>

                            <div className={cx('single-input-fields')}>
                                <div>
                                    <input type="checkbox" />
                                    <label>Duy trì đăng nhập</label>
                                </div>
                                <Link to={'/forgotPassword'}>Quên mật khẩu?</Link>
                            </div>
                        </div>
                        <div className={cx('login-footer')}>
                            <p className="mb-0">
                                Bạn chưa có tài khoản ?{' '}
                                <Link id={cx('link')} to="/register">
                                    Đăng ký
                                </Link>{' '}
                                ngay
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LoginUser;

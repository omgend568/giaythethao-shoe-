import classNames from 'classnames/bind';
import styles from '../Styles/Login.module.scss';
import request from '../Config/api';
import { GOOGLE_CLIENT_ID } from '../Config/googleAuth';

import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

const cx = classNames.bind(styles);

function LoginUser() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const googleBtnRef = useRef(null);
    const navigate = useNavigate();

    const handleCustomGoogleClick = () => {
        const googleBtn = googleBtnRef.current?.querySelector('div[role="button"]');
        googleBtn?.click();
    };

    const redirectAfterLogin = () => {
        navigate('/');
        window.location.reload();
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
                                    <>
                                        <button
                                            type="button"
                                            className={cx('google-login-btn')}
                                            onClick={handleCustomGoogleClick}
                                        >
                                            <svg
                                                className={cx('google-icon')}
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fill="#EA4335"
                                                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                                />
                                                <path
                                                    fill="#4285F4"
                                                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M24 48c6.48 0 11.93-2.13 16.15-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.42 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                                />
                                            </svg>
                                            đăng nhập với Google
                                        </button>
                                        <div className={cx('google-login-hidden')} ref={googleBtnRef}>
                                            <GoogleLogin
                                                type="standard"
                                                shape="rectangular"
                                                theme="outline"
                                                size="large"
                                                text="signin_with"
                                                onSuccess={handleGoogleSuccess}
                                                onError={handleGoogleError}
                                            />
                                        </div>
                                    </>
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

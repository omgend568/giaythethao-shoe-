import classNames from 'classnames/bind';
import styles from '../Styles/Cart.module.scss';

import Header from '../Components/Header';
import Footer from '../Components/Footer';
import request from '../Config/api';
import getUploadUrl from '../utils/getUploadUrl';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useStore } from '../hooks/useStore';

const cx = classNames.bind(styles);

const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

function Cart() {
    const [dataProducts, setDataProducts] = useState([]);
    const navigate = useNavigate();
    const [dataLengthProducts, setDataLengthProducts] = useState(0);
    const { dataCart, getCart, dataUser } = useStore();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (dataUser?.id) {
            getCart();
        }
    }, [dataUser, getCart]);

    const totalProduct = useMemo(() => {
        if (!dataCart || !dataCart.CartItems) return 0;
        return dataCart.CartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [dataCart]);

    useEffect(() => {
        if (dataCart && dataCart.CartItems) {
            setDataProducts(dataCart.CartItems);
        } else {
            setDataProducts([]);
        }
    }, [dataCart]);

    const handleDeleteCart = async (cartItemId) => {
        await request.post('/api/deletecart', { cartItemId }).then((res) => toast.success(res.data.message));
        getCart();
    };

    useEffect(() => {
        setDataLengthProducts(dataProducts?.length || 0);
    }, [dataProducts]);

    const nextPage = () => {
        if (dataProducts.length > 0) {
            navigate('/payments');
        } else {
            toast.error('Vui lòng thêm sản phẩm vào giỏ hàng để thanh toán !!!');
        }
    };

    if (!dataUser?.id) {
        return (
            <div className={cx('wrapper')}>
                <header>
                    <Header />
                </header>
                <main className={cx('main')}>
                    <div className={cx('no-product')}>
                        <span>Vui lòng đăng nhập để xem giỏ hàng</span>
                        <Link to="/login">Đăng nhập</Link>
                    </div>
                </main>
                <footer>
                    <Footer />
                </footer>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <h2>Giỏ Hàng</h2>
                <div className={cx('inner')}>
                    {dataCart && dataCart.CartItems && dataCart.CartItems.length > 0 ? (
                        <div>
                            {dataProducts?.map((item) => (
                                <div key={item.id} className={cx('cart-products')}>
                                    <div className={cx('img-product')}>
                                        <img
                                            src={getUploadUrl(
                                                item?.ProductVariant?.Product?.ProductImages?.[0]?.url
                                            )}
                                            alt=""
                                        />
                                    </div>

                                    <div className={cx('info-product')}>
                                        <h2>{item?.ProductVariant?.Product?.name}</h2>

                                        <span style={{ fontSize: '17px', fontWeight: '700' }}>
                                            Số Lượng: x{item?.quantity}
                                        </span>
                                        {item?.ProductVariant?.size && (
                                            <span style={{ fontSize: '17px', fontWeight: '700' }}>
                                                Size: {item?.ProductVariant?.size}
                                            </span>
                                        )}
                                        {item?.ProductVariant?.color && (
                                            <span style={{ fontSize: '17px', fontWeight: '700' }}>
                                                Màu: {item?.ProductVariant?.color}
                                            </span>
                                        )}
                                        <span id={cx('price')}>{formatPriceVN(item?.price * item?.quantity)}</span>
                                    </div>

                                    <div className={cx('remove-product')}>
                                        <button type="button" onClick={() => handleDeleteCart(item?.id)}>
                                            <FontAwesomeIcon icon={faClose} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={cx('no-product')}>
                            <img src="https://static.topcv.vn/v4/image/job-list/none-result.png" alt="" />
                            <span>Bạn Chưa Có Sản Phẩm Nào</span>
                        </div>
                    )}

                    <div className={cx('total-product')}>
                        <h3>TỔNG CỘNG | {dataLengthProducts} SẢN PHẨM</h3>
                        <div>
                            <table className="table table-bordered border-primary">
                                <thead>
                                    <tr>
                                        <th scope="col">Tạm tính</th>
                                        <th scope="col">{formatPriceVN(totalProduct)}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Phí Vận Chuyển</td>
                                        <td>Miễn phí vận chuyển</td>
                                    </tr>
                                    <tr>
                                        <td>Tổng Cộng</td>
                                        <th>{formatPriceVN(totalProduct)}</th>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={cx('btn-total')}>
                            <button type="button" id={cx('btn-buy')} onClick={nextPage}>
                                Tiến hành thanh toán
                            </button>
                            <button type="button" id={cx('btn-continue')}>
                                <Link to={'/category'}>Tiếp tục mua sắm</Link>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default Cart;

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

const sortVariantsBySize = (variants) =>
    [...variants].sort((a, b) => {
        const sizeA = Number(a.size);
        const sizeB = Number(b.size);
        if (!Number.isNaN(sizeA) && !Number.isNaN(sizeB)) {
            return sizeA - sizeB;
        }
        return String(a.size).localeCompare(String(b.size), 'vi', { numeric: true });
    });

const getSizeOptions = (item) => {
    const color = item?.ProductVariant?.color;
    const variants = item?.ProductVariant?.Product?.ProductVariants || [];
    return sortVariantsBySize(variants.filter((v) => v.color === color));
};

const getColorOptions = (item) => {
    const variants = item?.ProductVariant?.Product?.ProductVariants || [];
    return Array.from(new Set(variants.map((v) => v.color))).filter(Boolean);
};

const getMaxStock = (item) => {
    const stock = item?.ProductVariant?.stock;
    if (stock === undefined || stock === null) return Infinity;
    const parsed = Number(stock);
    return Number.isNaN(parsed) ? 0 : parsed;
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

    const handleUpdateQuantity = async (cartItemId, quantity, maxStock) => {
        if (quantity < 1) return;

        if (quantity > maxStock) {
            toast.error(maxStock > 0 ? `Chỉ còn ${maxStock} sản phẩm trong kho` : 'Sản phẩm đã hết hàng');
            return;
        }

        try {
            await request.post('/api/updatecart', { cartItemId, quantity });
            await getCart();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng');
        }
    };

    const handleUpdateVariant = async (cartItemId, productVariantId, currentQuantity) => {
        if (!productVariantId) return;
        try {
            await request.post('/api/updatecart', { cartItemId, productVariantId, quantity: currentQuantity });
            await getCart();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật variant');
        }
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
                            {dataProducts?.map((item) => {
                                const maxStock = getMaxStock(item);

                                return (
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

                                        <div className={cx('cart-controls')}>
                                            <div className={cx('control-row')}>
                                                <span>Số lượng:</span>
                                                <div className={cx('form-quantity')}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateQuantity(
                                                                item.id,
                                                                item.quantity - 1,
                                                                maxStock
                                                            )
                                                        }
                                                    >
                                                        -
                                                    </button>
                                                    <input id={cx('quantity')} value={item.quantity} readOnly />
                                                    <button
                                                        type="button"
                                                        disabled={item.quantity >= maxStock}
                                                        onClick={() =>
                                                            handleUpdateQuantity(
                                                                item.id,
                                                                item.quantity + 1,
                                                                maxStock
                                                            )
                                                        }
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={cx('variant-selection')}>
                                                {item?.ProductVariant?.color && (
                                                    <div className={cx('variant-group')}>
                                                        <span className={cx('color-label')}>Màu:</span>
                                                        <div className={cx('color-options')}>
                                                            {getColorOptions(item).map((col) => {
                                                                const currentSize = item?.ProductVariant?.size;
                                                                const variants = item?.ProductVariant?.Product?.ProductVariants || [];
                                                                const target = variants.find(
                                                                    (v) =>
                                                                        v.color === col &&
                                                                        String(v.size) === String(currentSize)
                                                                );
                                                                const targetStock = Number(target?.stock || 0);

                                                                return (
                                                                    <button
                                                                        key={col}
                                                                        type="button"
                                                                        className={cx('color-option', col === item?.ProductVariant?.color ? 'active' : '')}
                                                                        onClick={() => {
                                                                            if (!target || targetStock < item.quantity) {
                                                                                toast.error('Hết size cùng loại');
                                                                                return;
                                                                            }
                                                                            if (target.id === item?.ProductVariant?.id) return;
                                                                            handleUpdateVariant(item.id, target.id, item.quantity);
                                                                        }}
                                                                    >
                                                                        {col}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {item?.ProductVariant?.size && (
                                                    <div className={cx('variant-group')}>
                                                        <span className={cx('color-label')}>Kích cỡ:</span>
                                                        <div className={cx('size-options')}>
                                                            {getSizeOptions(item).map((variant) => (
                                                                <button
                                                                    key={variant.id}
                                                                    type="button"
                                                                    className={cx(
                                                                        'size-option',
                                                                        variant.size === item?.ProductVariant?.size ? 'active' : ''
                                                                    )}
                                                                    onClick={() => handleUpdateVariant(item.id, variant.id, item.quantity)}
                                                                >
                                                                    {variant.size}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <span id={cx('price')}>{formatPriceVN(item?.price * item?.quantity)}</span>
                                    </div>

                                    <div className={cx('remove-product')}>
                                        <button type="button" onClick={() => handleDeleteCart(item?.id)}>
                                            <FontAwesomeIcon icon={faClose} />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
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

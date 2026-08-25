import classNames from 'classnames/bind';
import styles from '../../Styles/ModalDetailProduct.module.scss';
import Modal from 'react-bootstrap/Modal';
import addToCartProduct from '../HandleCart/AddToCart';
import request from '../../Config/api';
import getUploadUrl from '../getUploadUrl';

import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
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

function ModalDetailProduct({ id, show, setShow, onHoverEnter, onHoverLeave }) {
    const handleClose = () => setShow(false);
    const [quantity, setQuantity] = useState(1);
    const [dataProduct, setDataProduct] = useState([]);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);

    const { dataUser , getCart } = useStore();

    useEffect(() => {
        if (dataProduct && dataProduct.length > 0) {
            const item = dataProduct[0];
            const variants = item.ProductVariants || [];
            if (variants.length > 0) {
                setSelectedVariant(variants[0]);
                setSelectedColor(variants[0].color);
                setSelectedSize(variants[0].size);
            }
        }
    }, [dataProduct]);
    useEffect(() => {
        if (!id) {
            return;
        }
        request
            .get('/api/product', {
                params: { id },
            })
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    setDataProduct(res.data);
                    document.title = `${res.data[0].name} - Shoe Store`;
                }
            });
    }, [id]);

    const handleAddToCart = async () => {
        if (!dataUser?.id) {
            return toast.error('Vui lòng đăng ký và đăng nhập để mua hàng');
        }
        if (!selectedVariant) {
            return toast.error('Vui lòng chọn màu và kích cỡ sản phẩm');
        }
        const maxStock = getMaxStock();
        if (quantity > maxStock) {
            return toast.error(maxStock > 0 ? `Chỉ còn ${maxStock} sản phẩm trong kho` : 'Sản phẩm đã hết hàng');
        }
        try {
            await addToCartProduct(selectedVariant, quantity);
            await getCart();
            toast.success('Thêm vào giỏ hàng thành công');
            handleClose();
        } catch (error) {
            if (error.message !== 'NOT_LOGGED_IN' && !error.response?.data?.message) {
                toast.error('Không thể thêm vào giỏ hàng');
            }
        }
    };

    useEffect(() => {
        if (quantity < 1) {
            setQuantity(1);
        }
    }, [quantity]);

    useEffect(() => {
        if (selectedVariant?.stock != null) {
            const max = Number(selectedVariant.stock);
            if (!Number.isNaN(max) && quantity > max) {
                setQuantity(Math.max(1, max));
            }
        }
    }, [selectedVariant, quantity]);

    const getMaxStock = () => {
        if (selectedVariant?.stock == null) return Infinity;
        const max = Number(selectedVariant.stock);
        return Number.isNaN(max) ? 0 : max;
    };

    const handleIncreaseQuantity = () => {
        const maxStock = getMaxStock();
        if (quantity >= maxStock) {
            toast.error(maxStock > 0 ? `Chỉ còn ${maxStock} sản phẩm trong kho` : 'Sản phẩm đã hết hàng');
            return;
        }
        setQuantity(quantity + 1);
    };

    return (
        <div className={cx('wrapper')}>
            <Modal show={show} size="lg" aria-labelledby="contained-modal-title-vcenter" centered onHide={handleClose}>
                {dataProduct.map((item) => (
                    <Modal.Body
                        key={item.id}
                        className={cx('modal-body')}
                        onMouseEnter={onHoverEnter}
                        onMouseLeave={onHoverLeave}
                    >
                        <div className={cx('img')}>
                            <img src={getUploadUrl(item.ProductImages?.[0]?.url)} alt="" />
                        </div>

                        <div className={cx('content')}>
                            <h2>{item.name}</h2>
                            <span id={cx('price')}>
                                {selectedVariant ? formatPriceVN(selectedVariant.price) : formatPriceVN(item.price)}
                            </span>
                            <div dangerouslySetInnerHTML={{ __html: item?.description }} />
                            <div />
                            {/* variant selection */}
                            <div className={cx('select-size')}>
                                <span>Màu: </span>
                                <div className={cx('form-size')}>
                                    {Array.from(
                                        new Set((item.ProductVariants || []).map((v) => v.color))
                                    ).map((col) => (
                                        <div
                                            key={col}
                                            onClick={() => {
                                                setSelectedColor(col);
                                                // pick first variant with this color
                                                const first = (item.ProductVariants || []).find(
                                                    (v) => v.color === col
                                                );
                                                if (first) {
                                                    setSelectedVariant(first);
                                                    setSelectedSize(first.size);
                                                }
                                            }}
                                            className={cx(selectedColor === col ? 'active' : '')}
                                        >
                                            <button>{col}</button>
                                        </div>
                                    ))}
                                </div>
                                {selectedColor && (
                                    <>
                                        <span>Kích cỡ:</span>
                                        <div className={cx('form-size')}>
                                            {(sortVariantsBySize(
                                                (item.ProductVariants || []).filter((v) => v.color === selectedColor)
                                            )).map((v) => (
                                                    <div
                                                        key={v.size}
                                                        onClick={() => {
                                                            setSelectedSize(v.size);
                                                            setSelectedVariant(v);
                                                        }}
                                                        className={cx(
                                                            selectedSize === v.size ? 'active' : ''
                                                        )}
                                                    >
                                                        <button>{v.size}</button>
                                                    </div>
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            {dataUser?.id ? (
                                <div className={cx('btn-add-to-cart')}>
                                    <div className={cx('form-quantity')}>
                                        <button type="button" onClick={() => setQuantity(quantity - 1)}>
                                            -
                                        </button>
                                        <input
                                            id={cx('quantity')}
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            disabled={quantity >= getMaxStock()}
                                            onClick={handleIncreaseQuantity}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className={cx('btn-add-cart')}>
                                        <button type="button" onClick={handleAddToCart}>
                                            Thêm Vào Giỏ Hàng
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={cx('login-prompt')}>
                                    <p>Vui lòng đăng ký và đăng nhập để mua hàng</p>
                                    <div className={cx('login-actions')}>
                                        <Link to="/login" onClick={handleClose}>
                                            Đăng nhập
                                        </Link>
                                        <Link to="/register" onClick={handleClose}>
                                            Đăng ký
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal.Body>
                ))}
            </Modal>
        </div>
    );
}

export default ModalDetailProduct;

import classNames from 'classnames/bind';
import styles from '../../Styles/ModalDetailProduct.module.scss';
import Modal from 'react-bootstrap/Modal';
import addToCartProduct from '../HandleCart/AddToCart';
import request from '../../Config/api';

import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import { useStore } from '../../hooks/useStore';
const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

function ModalDetailProduct({ id, show, setShow }) {
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
            return toast.error('Vui lòng đăng nhập');
        }
        if (!selectedVariant) {
            return toast.error('Vui lòng chọn variant');
        }
        try {
            await addToCartProduct(selectedVariant, quantity);
            await getCart();
            toast.success('Thêm vào giỏ hàng thành công');
        } catch (error) {
            toast.error('Vui lòng đăng nhập');
        }
    };

    useEffect(() => {
        if (quantity < 1) {
            setQuantity(1);
        }
    }, [quantity]);

    return (
        <div className={cx('wrapper')}>
            <Modal show={show} size="lg" aria-labelledby="contained-modal-title-vcenter" centered onHide={handleClose}>
                {dataProduct.map((item) => (
                    <Modal.Body key={item.id} className={cx('modal-body')}>
                        <div className={cx('img')}>
                            <img src={`${process.env.REACT_APP_IMG}/${item.ProductImages?.[0]?.url}`} alt="" />
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
                                            {(item.ProductVariants || [])
                                                .filter((v) => v.color === selectedColor)
                                                .map((v) => (
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
                            <div className={cx('btn-add-to-cart')}>
                                <div className={cx('form-quantity')}>
                                    <button onClick={() => setQuantity(quantity - 1)}>-</button>
                                    <input
                                        id={cx('quantity')}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                                </div>
                                <div className={cx('btn-add-cart')}>
                                    <button onClick={handleAddToCart}>Thêm Vào Giỏ Hàng</button>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                ))}
            </Modal>
        </div>
    );
}

export default ModalDetailProduct;

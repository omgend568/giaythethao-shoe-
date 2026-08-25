import classNames from 'classnames/bind';
import styles from '../Styles/DetailProducts.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import request from '../Config/api';
import getUploadUrl from '../utils/getUploadUrl';

import { useEffect, useState } from 'react';
import addToCartProduct from '../utils/HandleCart/AddToCart';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../Components/Navbar';

import CardBody from '../Components/CardBody';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faRulerHorizontal } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import Comments from '../Components/Comments';
import SelectSize from '../utils/SelectSize/SelectSize';

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

function DetailProducts() {
    const location = useLocation();

    const id = location.pathname.split('/')[2];
    const nameProduct = window.location.pathname.split('/')[3];

    const [dataProduct, setDataProduct] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [selectImg, setSelectImg] = useState(0);

    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);

    const [show, setShow] = useState(false);

    const [similarProduct, setSimilarProduct] = useState([]);

    const { getCart, dataUser } = useStore();

    useEffect(() => {
        if (dataUser?.id) {
            getCart();
        }
    }, [dataUser, getCart]);

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                if (!(dataProduct && dataProduct.length > 0)) return;

                const newNameProduct = nameProduct ? nameProduct.slice(0, 16) : '';
                const res = await request.get('/api/similarproduct', { params: { nameProduct: newNameProduct } });

                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    const currentId = dataProduct[0]?.id ?? dataProduct[0]?._id;
                    const filteredByName = res.data.filter((p) => {
                        const pid = p.id ?? p._id;
                        return pid !== currentId;
                    });

                    if (filteredByName.length > 0) {
                        setSimilarProduct(filteredByName);
                        return;
                    }
                }

                const brandId = dataProduct[0].brandId || dataProduct[0].Brand?.id;
                if (brandId) {
                    const allRes = await request.get('/api/products');
                    if (allRes.data && Array.isArray(allRes.data)) {
                        const filtered = allRes.data.filter(
                            (p) => (p.brandId || p.Brand?.id) === brandId && p.id !== dataProduct[0].id
                        );
                        setSimilarProduct(filtered);
                        return;
                    }
                }

                setSimilarProduct([]);
            } catch (error) {
                console.error('Error fetching similar products:', error);
                setSimilarProduct([]);
            }
        };

        fetchSimilar();
    }, [dataProduct, nameProduct]);

    useEffect(() => {
        if (dataProduct && dataProduct.length > 0) {
            setSelectedVariant(null);
            setSelectedColor('');
            setSelectedSize('');
        }
    }, [dataProduct]);

    useEffect(() => {
        if (!dataProduct || dataProduct.length === 0) return;
        const variants = dataProduct[0].ProductVariants || [];
        const found = variants.find((v) => v.color === selectedColor && v.size === selectedSize);
        if (found) setSelectedVariant(found);
    }, [selectedColor, selectedSize, dataProduct]);

    useEffect(() => {
        if (!id) return;
        setSelectImg(0);
        setSimilarProduct([]);

        const defaultTitle = 'Giày Thể Thao Thời Trang';

        request
            .get('/api/product', {
                params: { id },
            })
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    setDataProduct(res.data);
                } else if (res.data && typeof res.data === 'object') {
                    setDataProduct([res.data]);
                }
            })
            .catch((error) => {
                console.error('Error fetching product:', error);
                setDataProduct([]);
            });

        return () => {
            document.title = defaultTitle;
        };
    }, [id]);

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

    const handleImgClick = (index) => {
        setSelectImg(index);
    };

    const handleAddProduct = async () => {
        if (!dataUser?.id) {
            toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ');
            return;
        }

        try {
            if (!selectedColor || !selectedSize || !selectedVariant) {
                toast.error('Vui lòng chọn màu và kích cỡ sản phẩm');
                return;
            }
            const maxStock = getMaxStock();
            if (quantity > maxStock) {
                toast.error(maxStock > 0 ? `Chỉ còn ${maxStock} sản phẩm trong kho` : 'Sản phẩm đã hết hàng');
                return;
            }
            const data = await addToCartProduct(selectedVariant, quantity);
            toast.success(data?.data?.message || 'Thêm vào giỏ hàng thành công');
            await getCart();
        } catch (error) {
            if (error.message !== 'NOT_LOGGED_IN' && !error.response?.data?.message) {
                toast.error('Không thể thêm vào giỏ hàng');
            }
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const handleShowSelectSzie = () => {
        setShow(!show);
    };

    const onNextImg = () => {
        if (dataProduct && dataProduct.length > 0 && dataProduct[0].ProductImages) {
            if (selectImg < dataProduct[0].ProductImages.length - 1) {
                setSelectImg(selectImg + 1);
            } else {
                setSelectImg(0);
            }
        }
    };

    const onPrevImg = () => {
        if (dataProduct && dataProduct.length > 0 && dataProduct[0].ProductImages) {
            if (selectImg > 0) {
                setSelectImg(selectImg - 1);
            } else {
                setSelectImg(dataProduct[0].ProductImages.length - 1);
            }
        }
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <Navbar props={dataProduct} />
                {dataProduct &&
                    dataProduct.length > 0 &&
                    dataProduct.map((item) => (
                        <div key={item.id} className={cx('form-product')}>
                            <div className={cx('img-product')}>
                                <div className={cx('img-small')}>
                                    {item.ProductImages &&
                                        item.ProductImages.map((item2, index) => (
                                            <img
                                                className={cx({ active: index === selectImg })}
                                                key={index}
                                                onClick={() => handleImgClick(index)}
                                                src={getUploadUrl(item2.url)}
                                                alt=""
                                            />
                                        ))}
                                </div>

                                <img
                                    className={cx('img')}
                                    src={getUploadUrl(item.ProductImages && item.ProductImages[selectImg]?.url)}
                                    alt=""
                                />
                                <button onClick={onPrevImg} id={cx('btn-1')}>
                                    <FontAwesomeIcon icon={faAngleLeft} />
                                </button>
                                <button onClick={onNextImg} id={cx('btn-2')}>
                                    <FontAwesomeIcon icon={faAngleRight} />
                                </button>
                            </div>
                            <div className={cx('info-product')}>
                                <div className={cx('title-product')}>
                                    <h2>{item.name}</h2>
                                    <span>
                                        {formatPriceVN(
                                            selectedVariant
                                                ? selectedVariant.price
                                                : item.ProductVariants?.[0]?.price || item.price || 0
                                        )}
                                    </span>
                                </div>
                                <div className={cx('select-size')}>
                                    <div onClick={handleShowSelectSzie} className={cx('btn-select')}>
                                        <button>
                                            <FontAwesomeIcon icon={faRulerHorizontal} /> HƯỚNG DẪN CHỌN SIZE
                                        </button>
                                        <div>
                                            <SelectSize dataProduct={dataProduct} show={show} setShow={setShow} />
                                        </div>
                                    </div>
                                    {item.ProductVariants && item.ProductVariants.length > 0 && (
                                        <>
                                            <span>Màu:</span>
                                            <div className={cx('form-size')}>
                                                {Array.from(new Set(item.ProductVariants.map((v) => v.color))).map((col) => (
                                                    <div
                                                        key={col}
                                                        onClick={() => {
                                                            setSelectedColor(col);
                                                            setSelectedSize('');
                                                            setSelectedVariant(null);
                                                        }}
                                                        className={cx(selectedColor === col ? 'active' : '')}
                                                    >
                                                        <button type="button">{col}</button>
                                                    </div>
                                                ))}
                                            </div>
                                            {selectedColor && (
                                                <>
                                                    <span>Kích cỡ:</span>
                                                    <div className={cx('form-size')}>
                                                        {sortVariantsBySize(
                                                            item.ProductVariants.filter((v) => v.color === selectedColor)
                                                        ).map((v) => (
                                                                <div
                                                                    key={v.id}
                                                                    onClick={() => {
                                                                        setSelectedSize(v.size);
                                                                        setSelectedVariant(v);
                                                                    }}
                                                                    className={cx(selectedSize === v.size ? 'active' : '')}
                                                                >
                                                                    <button type="button">{v.size}</button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <div className={cx('form-quantity')}>
                                        <button type="button" onClick={() => setQuantity(quantity - 1)}>
                                            -
                                        </button>
                                        <input id={cx('quantity')} value={quantity} readOnly />
                                        <button
                                            type="button"
                                            disabled={quantity >= getMaxStock()}
                                            onClick={handleIncreaseQuantity}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className={cx('btn-add-cart')}>
                                    <button type="button" onClick={handleAddProduct}>
                                        Thêm Vào Giỏ Hàng
                                    </button>
                                </div>
                                <div className={cx('container')}>
                                    <div className={cx('box')}>
                                        <img
                                            src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-3.png?resize=40%2C41&ssl=1"
                                            alt=""
                                        />
                                        <div id={cx('info')}>
                                            <span style={{ fontWeight: '800' }}>Miễn phí vận chuyển</span>
                                            <span>Cho đơn hàng từ 800k</span>
                                        </div>
                                    </div>

                                    <div className={cx('box')}>
                                        <img
                                            src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon.png?resize=40%2C41&ssl=1"
                                            alt=""
                                        />
                                        <div id={cx('info')}>
                                            <span style={{ fontWeight: '800' }}>Bảo hành 6 tháng</span>
                                            <span>15 ngày đổi trả</span>
                                        </div>
                                    </div>

                                    <div className={cx('box')}>
                                        <img
                                            src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-1-1.png?resize=40%2C41&ssl=1"
                                            alt=""
                                        />
                                        <div id={cx('info')}>
                                            <span style={{ fontWeight: '800' }}>Thanh toán COD</span>
                                            <span>Yên tâm mua sắm</span>
                                        </div>
                                    </div>

                                    <div className={cx('box')}>
                                        <img
                                            src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-2-1.png?resize=40%2C41&ssl=1"
                                            alt=""
                                        />
                                        <div id={cx('info')}>
                                            <span style={{ fontWeight: '800' }}>Hotline: 0866550286</span>
                                            <span>Hỗ trợ bạn 24/7</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                {dataProduct &&
                    dataProduct.length > 0 &&
                    dataProduct.map((item) => (
                        <div key={item.id} className={cx('description')}>
                            <div>
                                <h2>THÔNG TIN SẢN PHẨM</h2>
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: item?.description }} />
                        </div>
                    ))}

                {dataProduct && dataProduct.length > 0 && <Comments productId={dataProduct[0].id} />}

                {similarProduct.length > 0 && (
                    <div className={cx('similar-section')}>
                        <h2>Sản phẩm cùng loại</h2>
                        <div className={cx('similar-grid')}>
                            {similarProduct.slice(0, 8).map((item) => (
                                <CardBody key={item.id || item._id} item={item} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default DetailProducts;

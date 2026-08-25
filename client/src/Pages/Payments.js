import classNames from 'classnames/bind';
import styles from '../Styles/Payments.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import axios from 'axios'; // Đã được sử dụng bên dưới
import request, { requestPaymentVNPAY } from '../Config/api';
import getUploadUrl from '../utils/getUploadUrl';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

const cx = classNames.bind(styles);

const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const normalizeLocationName = (value) =>
    (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

const matchLocation = (list, name) => {
    if (!name || !list?.length) return null;

    const target = normalizeLocationName(name);
    return list.find((item) => {
        const fullName = normalizeLocationName(item.full_name);
        const shortName = normalizeLocationName(item.name);
        return (
            fullName === target ||
            shortName === target ||
            fullName.includes(target) ||
            target.includes(fullName) ||
            target.includes(shortName)
        );
    });
};

const parseSavedAddress = (fullAddress) => {
    if (!fullAddress?.trim()) return null;

    const parts = fullAddress
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length < 4) {
        return { street: fullAddress.trim(), province: '', district: '', ward: '' };
    }

    return {
        street: parts.slice(0, parts.length - 3).join(', '),
        ward: parts[parts.length - 3],
        district: parts[parts.length - 2],
        province: parts[parts.length - 1],
    };
};

function Payments() {
    const [dataCart, setDataCart] = useState([]);
    const [tinhthanh, setTinhThanh] = useState([]);
    const [idTinhThanh, setIdTinhThanh] = useState(0);
    const [huyen, setHuyen] = useState([]);
    const [idHuyen, setIdHuyen] = useState(0);
    const [xa, setXa] = useState([]);
    const [idXa, setIdXa] = useState(0); 
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [dataProducts, setDataProducts] = useState([]);
    const [dataLengthProducts, setDataLengthProducts] = useState(0);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [hasSavedAddress, setHasSavedAddress] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromotion, setAppliedPromotion] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [activePromotions, setActivePromotions] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const navigate = useNavigate();
    const { dataUser, getCart, getAuthUser } = useStore();
    const isPrefillingAddress = useRef(false);
    const addressPrefilled = useRef(false);

    useEffect(() => {
        getAuthUser();
    }, []);

    useEffect(() => {
        request.get('/api/promotions/active')
            .then((res) => setActivePromotions(res.data))
            .catch((err) => console.error('Lỗi lấy khuyến mãi:', err));
    }, []);

    useEffect(() => {
        if (dataUser?.fullname) setName(dataUser.fullname);
        if (dataUser?.phone) setPhone(dataUser.phone);
    }, [dataUser?.fullname, dataUser?.phone]);

    useEffect(() => {
        const prefillSavedAddress = async () => {
            if (addressPrefilled.current || !dataUser?.address?.trim() || tinhthanh.length === 0) {
                return;
            }

            const parsed = parseSavedAddress(dataUser.address);
            if (!parsed) return;

            isPrefillingAddress.current = true;
            setAddress(parsed.street);
            setHasSavedAddress(true);

            try {
                const province = matchLocation(tinhthanh, parsed.province);
                if (!province) return;

                setIdTinhThanh(province.id);

                const districtRes = await axios.get(`https://esgoo.net/api-tinhthanh/2/${province.id}.htm`);
                const districtList = districtRes.data.data || [];
                setHuyen(districtList);

                const district = matchLocation(districtList, parsed.district);
                if (!district) return;

                setIdHuyen(district.id);

                const wardRes = await axios.get(`https://esgoo.net/api-tinhthanh/3/${district.id}.htm`);
                const wardList = wardRes.data.data || [];
                setXa(wardList);

                const ward = matchLocation(wardList, parsed.ward);
                if (ward) setIdXa(ward.id);
            } catch (error) {
                console.error('Lỗi điền địa chỉ đã lưu:', error);
            } finally {
                isPrefillingAddress.current = false;
                addressPrefilled.current = true;
            }
        };

        prefillSavedAddress();
    }, [dataUser?.address, tinhthanh]);

    // 1. Lấy danh sách Tỉnh/Thành khi component load
    useEffect(() => {
        axios.get('https://esgoo.net/api-tinhthanh/1/0.htm')
            .then((res) => setTinhThanh(res.data.data))
            .catch(err => console.error("Lỗi lấy tỉnh thành:", err));
    }, []);

    useEffect(() => {
        if (isPrefillingAddress.current || !idTinhThanh || idTinhThanh === '0') {
            if (!idTinhThanh || idTinhThanh === '0') {
                setHuyen([]);
                setXa([]);
            }
            return;
        }

        axios
            .get(`https://esgoo.net/api-tinhthanh/2/${idTinhThanh}.htm`)
            .then((res) => setHuyen(res.data.data))
            .catch((err) => console.error('Lỗi lấy huyện:', err));
    }, [idTinhThanh]);

    // 3. Lấy danh sách Xã/Phường khi idHuyen thay đổi
    useEffect(() => {
        if (isPrefillingAddress.current || !idHuyen || idHuyen === '0') {
            if (!idHuyen || idHuyen === '0') {
                setXa([]);
            }
            return;
        }

        axios
            .get(`https://esgoo.net/api-tinhthanh/3/${idHuyen}.htm`)
            .then((res) => setXa(res.data.data))
            .catch((err) => console.error('Lỗi lấy xã:', err));
    }, [idHuyen]);

    // Lấy dữ liệu giỏ hàng
    useEffect(() => {
        request.get('/api/cart').then((res) => setDataCart(res.data));
    }, []);

    const totalProduct = useMemo(() => {
        if (!dataCart || !dataCart.CartItems) return 0;
        return dataCart.CartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [dataCart]);

    const finalTotal = useMemo(() => {
        return Math.max(0, totalProduct - discountAmount);
    }, [totalProduct, discountAmount]);

    const getFullAddress = () => {
        const tinhSelected = tinhthanh.find((item) => String(item.id) === String(idTinhThanh));
        const huyenSelected = huyen.find((item) => String(item.id) === String(idHuyen));
        const xaSelected = xa.find((item) => String(item.id) === String(idXa));

        const tenTinh = tinhSelected ? tinhSelected.full_name : '';
        const tenHuyen = huyenSelected ? huyenSelected.full_name : '';
        const tenXa = xaSelected ? xaSelected.full_name : '';

        return `${address}${tenXa ? ', ' + tenXa : ''}${tenHuyen ? ', ' + tenHuyen : ''}${tenTinh ? ', ' + tenTinh : ''}`;
    };

    const isAddressComplete = () => {
        if (address?.trim() && idTinhThanh && idTinhThanh !== '0') {
            return true;
        }

        return Boolean(dataUser?.address?.trim());
    };

    const resolvePaymentAddress = () => {
        const fullAddress = getFullAddress();
        if (fullAddress.replace(/[, ]/g, '').length > 0) {
            return fullAddress;
        }

        return dataUser?.address?.trim() || '';
    };

    useEffect(() => {
    if (dataCart && dataCart.CartItems) {
        // Cập nhật danh sách sản phẩm
        setDataProducts(dataCart.CartItems);
        // Cập nhật số lượng sản phẩm
        setDataLengthProducts(dataCart.CartItems.length);
    } else {
        setDataProducts([]);
        setDataLengthProducts(0);
    }
}, [dataCart]);

    const handleApplyPromotion = async () => {
        if (!promoCode.trim()) {
            toast.error('Vui lòng nhập mã khuyến mãi');
            return;
        }

        const product_ids = dataCart?.CartItems?.map(item => item.ProductVariant?.productId) || [];

        try {
            const res = await request.post('/api/promotions/apply', {
                code: promoCode,
                order_amount: totalProduct,
                product_ids
            });

            setAppliedPromotion(res.data.promotion);
            setDiscountAmount(res.data.discount_amount);
            toast.success('Áp dụng mã khuyến mãi thành công!');
        } catch (error) {
            setAppliedPromotion(null);
            setDiscountAmount(0);
            toast.error(error.response?.data?.message || 'Mã khuyến mãi không hợp lệ');
        }
    };

    const handleRemovePromotion = () => {
        setPromoCode('');
        setAppliedPromotion(null);
        setDiscountAmount(0);
    };

    const handlePayment = async () => {
        // Chống double-submit
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const fullAddress = resolvePaymentAddress();

            if (!name || !phone || !isAddressComplete()) {
                toast.error('Vui lòng nhập đầy đủ thông tin và chọn địa chỉ!');
                setIsProcessing(false);
                return;
            }

            const paymentData = { address: fullAddress, name, phone };

            if (appliedPromotion) {
                paymentData.promotion_id = appliedPromotion.id;
            }

            if (paymentMethod === 'VNPAY') {
                const res = await requestPaymentVNPAY(paymentData);
                const paymentUrl = res?.paymentUrl || res?.data?.paymentUrl;
                if (paymentUrl) window.location.href = paymentUrl;
            } else if (paymentMethod === 'COD') {
                const res = await request.post('/api/paymentcod', paymentData);
                toast.success(res.data.message);
                await getAuthUser();
                await getCart();
                navigate('/paymentsuccess');
            }
        } catch (error) {
            // Xử lý lỗi double-submit từ server
            if (error.response?.status === 429) {
                toast.warning(error.response?.data?.message || 'Đơn hàng đang được xử lý, vui lòng đợi...');
            } else {
                toast.error(error.response?.data?.message || 'Thanh toán thất bại');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <Header />
            <main className={cx('main')}>
                <h2>Thanh toán</h2>
                <div className={cx('form-payments')}>
                    <div className={cx('column-left')}>
                        <h3>THÔNG TIN THANH TOÁN</h3>
                        {hasSavedAddress && (
                            <p className="text-muted small mb-3">
                                Đã điền sẵn thông tin từ lần mua hàng trước. Bạn có thể chỉnh sửa nếu cần.
                            </p>
                        )}
                        <div className={cx('form-1')}>
                            <div className="form-floating mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <label>Họ và tên *</label>
                            </div>
                            <div className="form-floating">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0901234567"
                                />
                                <label>Số điện thoại *</label>
                            </div>
                        </div>

                        <select
                            className="form-select mt-3"
                            value={idTinhThanh}
                            onChange={(e) => {
                                setIdTinhThanh(e.target.value);
                                setIdHuyen(0);
                                setIdXa(0);
                            }}
                        >
                            <option value="0">Tỉnh/Thành</option>
                            {tinhthanh.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-select mt-3"
                            value={idHuyen}
                            onChange={(e) => {
                                setIdHuyen(e.target.value);
                                setIdXa(0);
                            }}
                        >
                            <option value="0">Quận/Huyện</option>
                            {huyen.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        <select className="form-select mt-3" value={idXa} onChange={(e) => setIdXa(e.target.value)}>
                            <option value="0">Xã/Phường/Thị trấn</option>
                            {xa.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        <div className="form-floating mt-3">
                            <input
                                type="text"
                                className="form-control"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            <label>Số nhà, tên đường *</label>
                        </div>

                        <div className={cx('select-payment')}>
                            <h4>PHƯƠNG THỨC THANH TOÁN</h4>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                <label className="form-check-label">Thanh Toán Khi Nhận Hàng (COD)</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="paymentMethod" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                <label className="form-check-label">Thanh Toán Qua VNPAY</label>
                            </div>
                            <div className={cx('btn-payment')}>
                                <button 
                                    id={cx('btn-buy')} 
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Đang xử lý...' : 'Hoàn Tất Đơn Hàng'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={cx('total-product')}>
                        <h3>TỔNG CỘNG | {dataLengthProducts} SẢN PHẨM</h3>
                        <table className="table table-bordered border-primary">
                            <thead>
                                <tr>
                                    <th>Tạm tính</th>
                                    <th>{formatPriceVN(totalProduct)}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appliedPromotion && (
                                    <tr style={{ color: 'green' }}>
                                        <td>Khuyến mãi ({appliedPromotion.code})</td>
                                        <td>-{formatPriceVN(discountAmount)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td>Phí Vận Chuyển</td>
                                    <td>Miễn phí</td>
                                </tr>
                                <tr>
                                    <td>Tổng Cộng</td>
                                    <th>{formatPriceVN(finalTotal)}</th>
                                </tr>
                            </tbody>
                        </table>

                        {/* Mã khuyến mãi */}
                        <div className={cx('promotion-section')}>
                            <h4>MÃ KHUYẾN MÃI</h4>
                            <p className="small text-muted mb-2">
                                <i className="fas fa-info-circle me-1"></i>
                                Chỉ áp dụng được 1 mã khuyến mãi cho mỗi đơn hàng
                            </p>
                            {appliedPromotion ? (
                                <div className={cx('applied-promotion')}>
                                    <div className="alert alert-success py-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{appliedPromotion.code}</strong>
                                                <div className="small">{appliedPromotion.name}</div>
                                                <div className="small text-success">
                                                    -{appliedPromotion.discount_type === 'percent'
                                                        ? `${appliedPromotion.discount_value}%`
                                                        : formatPriceVN(appliedPromotion.discount_value)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={handleRemovePromotion}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {activePromotions.length > 0 && (
                                        <div className={cx('available-promotions')}>
                                            <div className="small text-muted mb-2">Mã khuyến mãi có sẵn:</div>
                                            <div className={cx('promo-tags')}>
                                                {activePromotions.map((promo) => (
                                                    <button
                                                        key={promo.id}
                                                        type="button"
                                                        className={cx('promo-tag')}
                                                        onClick={() => {
                                                            setPromoCode(promo.code);
                                                        }}
                                                    >
                                                        <span className={cx('promo-code')}>{promo.code}</span>
                                                        <span className={cx('promo-discount')}>
                                                            {promo.discount_type === 'percent'
                                                                ? `${promo.discount_value}%`
                                                                : formatPriceVN(promo.discount_value)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className={cx('promo-input-group')}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Nhập mã khuyến mãi"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleApplyPromotion}
                                            disabled={!promoCode.trim()}
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className={cx('img')}> 
    {dataProducts?.map((item) => {
        // Truy cập vào mảng ảnh của sản phẩm
        const images = item.ProductVariant?.Product?.ProductImages;
        // Lấy url của tấm ảnh đầu tiên
        const imageUrl = (images && images.length > 0) ? images[0].url : null;

        return (
            <img
                key={item.id}
                // Nếu có imageUrl thì nối với link server, không thì hiện ảnh mặc định
                src={imageUrl ? getUploadUrl(imageUrl) : 'https://placehold.co/150?text=No+Image'}
                alt="Product"
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/150?text=Error';
                }}
            />
        );
    })}
</div>
                    </div>
                   
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Payments;
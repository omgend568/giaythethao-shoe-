import classNames from 'classnames/bind';
import styles from '../Styles/CardBody.module.scss';
import ModalDetailProduct from '../utils/Modal/ModalDetailProduct';
import getUploadUrl from '../utils/getUploadUrl';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faBolt } from '@fortawesome/free-solid-svg-icons';
import { faEye, faStar } from '@fortawesome/free-regular-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '../hooks/useStore';

import 'react-toastify/dist/ReactToastify.css';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

// Render stars for rating
const renderStars = (rating, size = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <span className={cx('rating-stars', size)}>
            {[...Array(fullStars)].map((_, i) => (
                <FontAwesomeIcon key={`full-${i}`} icon={faStar} className={cx('star', 'filled')} />
            ))}
            {hasHalfStar && <FontAwesomeIcon icon={faStar} className={cx('star', 'half')} />}
            {[...Array(emptyStars)].map((_, i) => (
                <FontAwesomeIcon key={`empty-${i}`} icon={faStar} className={cx('star', 'empty')} />
            ))}
        </span>
    );
};

function CardBody({ item }) {
    const [show, setShow] = useState(false);
    const { dataUser } = useStore();
    const navigate = useNavigate();
    const hoverTimerRef = useRef(null);
    const closeTimerRef = useRef(null);
    const openedByHoverRef = useRef(false);

    const canAutoHoverQuickView = () => window.matchMedia('(hover: hover)').matches;

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const handleShowModal = () => {
        openedByHoverRef.current = false;
        clearCloseTimer();
        setShow(!show);
    };

    const handleHoverQuickView = () => {
        if (!canAutoHoverQuickView()) return;
        clearCloseTimer();
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
        hoverTimerRef.current = setTimeout(() => {
            openedByHoverRef.current = true;
            setShow(true);
            hoverTimerRef.current = null;
        }, 1000);
    };

    const handleLeaveQuickView = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        if (show && openedByHoverRef.current) {
            clearCloseTimer();
            closeTimerRef.current = setTimeout(() => {
                setShow(false);
                openedByHoverRef.current = false;
                closeTimerRef.current = null;
            }, 1000);
        }
    };

    const handleEnterQuickViewArea = () => {
        clearCloseTimer();
    };

    const handleCartClick = () => {
        if (!dataUser?.id) {
            toast.error('Vui lòng đăng ký và đăng nhập để mua hàng');
            navigate('/login');
            return;
        }
        openedByHoverRef.current = false;
        clearCloseTimer();
        setShow(true);
    };

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('img')} onMouseEnter={handleHoverQuickView} onMouseLeave={handleLeaveQuickView}>
                <img src={getUploadUrl(item?.ProductImages?.[0]?.url)} alt="" />

                {item?.is_new && (
                    <div className={cx('badge-new')}>
                        <FontAwesomeIcon icon={faBolt} /> NEW
                    </div>
                )}

                <div className={cx('container')}>
                    <button type="button" onClick={handleCartClick}>
                        <FontAwesomeIcon icon={faCartPlus} />
                    </button>

                    <button type="button" onClick={handleShowModal}>
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                </div>
                <div className={cx('quick-view-label')}>Xem nhanh</div>
            </div>
            <Link style={{ textDecoration: 'none' }} to={`/product/${item?.id}/${item?.slug}`}>
                <div className={cx('info')}>
                    <h2>{item?.name}</h2>
                    <span>{formatPriceVN(item?.ProductVariants?.[0]?.price || item?.price || 0)}</span>
                    {item?.rating_avg > 0 && (
                        <div className={cx('rating-info')}>
                            {renderStars(item?.rating_avg)}
                            <span className={cx('rating-count')}>({item?.rating_count || 0})</span>
                        </div>
                    )}
                </div>
            </Link>
            <ModalDetailProduct
                show={show}
                setShow={setShow}
                id={item?.id}
                onHoverEnter={handleEnterQuickViewArea}
                onHoverLeave={handleLeaveQuickView}
            />
        </div>
    );
}

export default CardBody;

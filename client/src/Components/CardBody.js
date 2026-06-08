import classNames from 'classnames/bind';
import styles from '../Styles/CardBody.module.scss';
import ModalDetailProduct from '../utils/Modal/ModalDetailProduct';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-regular-svg-icons';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import 'react-toastify/dist/ReactToastify.css';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

function CardBody({ item }) {
    const [show, setShow] = useState(false);

    const handleShowModal = () => {
        setShow(!show);
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('img')}>
                <img src={`${process.env.REACT_APP_IMG}/${item?.ProductImages?.[0]?.url}`} alt="" />

                <div className={cx('container')}>
                    <button onClick={handleShowModal}>
                        <FontAwesomeIcon icon={faCartPlus} />
                    </button>

                    <button onClick={handleShowModal}>
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                </div>
            </div>
            <Link style={{ textDecoration: 'none' }} to={`/product/${item?.id}/${item?.slug}`}>
                <div className={cx('info')}>
                    <h2>{item?.name}</h2>
                    <span>{formatPriceVN(item?.ProductVariants?.[0]?.price || item?.price || 0)}</span>
                </div>
            </Link>
            <ModalDetailProduct show={show} setShow={setShow} id={item?.id} />
        </div>
    );
}

export default CardBody;

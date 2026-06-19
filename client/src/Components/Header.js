import classNames from 'classnames/bind';
import styles from '../Styles/Header.module.scss';
import request, { requestLogout } from '../Config/api';
import getUploadUrl from '../utils/getUploadUrl';
import useDebounce from '../hooks/useDebounce';

import logo from '../assests/imgs/logo.jpg';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCartPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import CategoryDropdown from './CategoryDropdown';
import { useEffect, useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { useStore } from '../hooks/useStore';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

function Header() {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const [searchValue, setSearchValue] = useState('');
    const [dataSearch, setDataSearch] = useState([]);

    const navigate = useNavigate();
    const handleShowMenu = () => {
        setShow(!show);
    };

    const { dataUser, dataCart } = useStore();

    const debounce = useDebounce(searchValue, 500);

    useEffect(() => {
        if (searchValue === '') {
            setDataSearch([]);
            return;
        }

        request
            .get('/api/search', { params: { nameProduct: debounce } })
            .then((res) => setDataSearch(Array.isArray(res.data) ? res.data : []))
            .catch(() => setDataSearch([]));
    }, [debounce, searchValue]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
            setSearchValue('');
            setDataSearch([]);
        }
    };

    const handleLogOut = async () => {
        try {
            await requestLogout();
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            navigate('/home');
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('inner')}>
                <div className={cx('row-left')}>
                    <Link to={'/home'}>
                        <img id={cx('logo')} src={logo} alt="" style={{ width: '120px', height: 'auto' }} />
                    </Link>
                    <ul>
                        <li>
                            <Link to={'/category'}>Tất Cả Sản Phẩm</Link>
                        </li>
                        <li>
                            <CategoryDropdown brandId={1} path={'giay-nam'} label={'Giày Nam'} />
                        </li>
                        <li>
                            <CategoryDropdown brandId={2} path={'giay-nu'} label={'Giày Nữ'} />
                        </li>
                        <li>
                            <CategoryDropdown brandId={3} path={'giay-tre-em'} label={'Giày Trẻ Em'} />
                        </li>
                    </ul>
                </div>

                <div className={cx('row-right')}>
                    <form className={cx('search')} onSubmit={handleSearchSubmit}>
                        <input
                            placeholder="Tìm Kiếm Sản Phẩm..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <button type="submit" className={cx('search-btn')} aria-label="Tìm kiếm">
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                        {searchValue.length > 0 ? (
                            <div className={cx('result')}>
                                {dataSearch.length > 0 ? (
                                    dataSearch.map((item) => (
                                        <Link
                                            to={`/product/${item.id}/${item.slug}`}
                                            key={item.id}
                                            onClick={() => {
                                                setSearchValue('');
                                                setDataSearch([]);
                                            }}
                                        >
                                            <div className={cx('form-result')}>
                                                <img src={getUploadUrl(item?.ProductImages?.[0]?.url)} alt="" />
                                                <span>{item.name}</span>
                                                <span id={cx('price')}>
                                                    {formatPriceVN(
                                                        item?.ProductVariants?.[0]?.price || item?.price || 0
                                                    )}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    debounce === searchValue && (
                                        <div className={cx('form-result', 'no-result')}>
                                            <span>Không tìm thấy sản phẩm</span>
                                        </div>
                                    )
                                )}
                                {dataSearch.length > 0 && (
                                    <Link
                                        to={`/search?q=${encodeURIComponent(searchValue.trim())}`}
                                        className={cx('view-all')}
                                        onClick={() => {
                                            setSearchValue('');
                                            setDataSearch([]);
                                        }}
                                    >
                                        Xem tất cả kết quả
                                    </Link>
                                )}
                            </div>
                        ) : null}
                    </form>

                    {dataUser?.id ? (
                        <div className={cx('cart-icon')}>
                            <Link to={'/cart'}>
                                <FontAwesomeIcon id={cx('icon-cart')} icon={faCartPlus} />
                            </Link>
                            {dataCart?.CartItems?.length > 0 ? (
                                <span>{dataCart.CartItems.length}</span>
                            ) : null}
                        </div>
                    ) : null}

                    <div>
                        {dataUser?.id ? (
                            <div className="dropdown">
                                <button
                                    className="btn  dropdown-toggle"
                                    type="button"
                                    id="dropdownMenuButton1"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <FontAwesomeIcon icon={faBars} />
                                </button>

                                <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                                    <li>
                                        <Link className="dropdown-item" to={'/info'}>
                                            Thông Tin Người Dùng
                                        </Link>
                                    </li>
                                    {dataUser?.isAdmin ? (
                                        <li>
                                            <Link style={{ color: 'red' }} className="dropdown-item" to={'/admin'}>
                                                Trang Quản Trị
                                            </Link>
                                        </li>
                                    ) : (
                                        <></>
                                    )}
                                    <li onClick={handleLogOut}>
                                        <a className="dropdown-item" href="/#">
                                            Đăng Xuất
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <div className={cx('login-btn')}>
                                <Link style={{ textDecoration: 'none' }} to={'/login'}>
                                    Đăng Nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className={cx('btn-menu-mobile')}>
                    <button onClick={handleShowMenu}>
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>

                <div className={cx('menu-mobile')}>
                    <>
                        <Offcanvas show={show} onHide={handleClose}>
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title>
                                    <Link to={'/home'}>
                                        <img src={logo} alt="" />
                                    </Link>
                                </Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body>
                                <div className={cx('row-left-mobile')}>
                                    <ul>
                                        <Link to={'/home'}>
                                            <li>Trang Chủ</li>
                                        </Link>
                                        <Link to={'/category'}>
                                            <li>Tất Cả Sản Phẩm</li>
                                        </Link>
                                        <Link to={'/category/giay-nam'}>
                                            <li>Nam</li>
                                        </Link>
                                        <Link to={'/category/giay-nu'}>
                                            <li>Nữ</li>
                                        </Link>
                                        <Link to={'/category/giay-tre-em'}>
                                            <li>Trẻ Em</li>
                                        </Link>
                                        {dataUser?.id ? (
                                            <Link to={'/cart'} onClick={handleClose}>
                                                <li>Giỏ Hàng</li>
                                            </Link>
                                        ) : null}

                                        <Link to={dataUser?.id ? '/info' : '/login'}>
                                            <li>Thông Tin Người Dùng</li>
                                        </Link>

                                        {dataUser?.isAdmin ? (
                                            <li>
                                                <Link style={{ color: 'red' }} className="dropdown-item" to={'/admin'}>
                                                    Trang Quản Trị
                                                </Link>
                                            </li>
                                        ) : (
                                            <></>
                                        )}
                                        {dataUser?.id ? (
                                            <li onClick={handleLogOut}>
                                                <a
                                                    style={{ color: 'red', fontWeight: '700' }}
                                                    className="dropdown-item"
                                                    href="/#"
                                                >
                                                    Đăng Xuất
                                                </a>
                                            </li>
                                        ) : (
                                            <></>
                                        )}
                                    </ul>
                                </div>
                            </Offcanvas.Body>
                        </Offcanvas>
                    </>
                </div>
            </div>
        </div>
    );
}

export default Header;

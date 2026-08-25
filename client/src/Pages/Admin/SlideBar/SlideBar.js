import classNames from 'classnames/bind';
import styles from './Slidebar.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faCartPlus, faList, faRightFromBracket, faComments, faTags, faUsers, faChartBar } from '@fortawesome/free-solid-svg-icons';
import request from '../../../Config/api';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

function SlideBar({ setCheckTypeSlideBar, checkTypeSlideBar }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        request.post('/api/logout').then(() => {});
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        navigate('/home');
    };

    return (
        <div className={cx('wrapper')}>
            <h4>Quản Trị Admin</h4>
            <ul>
                <li onClick={() => setCheckTypeSlideBar(1)} id={cx(checkTypeSlideBar === 1 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faBagShopping} />
                    Quản Lý Sản Phẩm
                </li>
                <li onClick={() => setCheckTypeSlideBar(2)} id={cx(checkTypeSlideBar === 2 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faList} />
                    Quản Lý Danh Mục
                </li>
                <li onClick={() => setCheckTypeSlideBar(3)} id={cx(checkTypeSlideBar === 3 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faCartPlus} />
                    Quản Lý Đơn Hàng
                </li>
                <li onClick={() => setCheckTypeSlideBar(4)} id={cx(checkTypeSlideBar === 4 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faComments} />
                    Quản Lý Bình Luận
                </li>
                <li onClick={() => setCheckTypeSlideBar(5)} id={cx(checkTypeSlideBar === 5 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faTags} />
                    Quản Lý Khuyến Mãi
                </li>
                <li onClick={() => setCheckTypeSlideBar(6)} id={cx(checkTypeSlideBar === 6 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faUsers} />
                    Quản Lý Người Dùng
                </li>
                <li onClick={() => setCheckTypeSlideBar(7)} id={cx(checkTypeSlideBar === 7 ? 'active' : '')}>
                    <FontAwesomeIcon icon={faChartBar} />
                    Thống Kê Doanh Thu
                </li>

                <li onClick={handleLogout} id={cx('logout')}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Đăng xuất
                </li>
            </ul>
        </div>
    );
}

export default SlideBar;

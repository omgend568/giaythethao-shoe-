import classNames from 'classnames/bind';
import styles from './Slidebar.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faList, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
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

                <li onClick={handleLogout} id={cx('logout')}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Đăng xuất
                </li>
            </ul>
        </div>
    );
}

export default SlideBar;

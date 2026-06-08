import classNames from 'classnames/bind';
import styles from '../Styles/Navbar.module.scss';

const cx = classNames.bind(styles);

function Navbar({ props = [] }) {
    return (
        <div className={cx('wrapper')}>
            {props.map((item) => {
                const brandName =
                    item.Brand?.name ||
                    (item.brandId === 1 ? 'Giày Nam' : item.brandId === 2 ? 'Giày Nữ' : 'Giày Trẻ Em');
                const key = item.id || item._id || item.slug || item.name;

                return (
                    <span key={key}>
                        Trang Chủ / {brandName} / {item.name}
                    </span>
                );
            })}
        </div>
    );
}

export default Navbar;

import classNames from 'classnames/bind';
import styles from '../Styles/Slider.module.scss';
import banner from '../assests/imgs/banner.jpg';

const cx = classNames.bind(styles);

function Slider() {
    return (
        <div className={cx('wrapper')}>
            <div id={cx('slider')}>
                <img src={banner} alt="Banner" style={{ height: '600px' }} />
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

                <div style={{ borderRight: 'none' }} className={cx('box')}>
                    <img
                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-2-1.png?resize=40%2C41&ssl=1"
                        alt=""
                    />
                    <div id={cx('info')}>
                        <span style={{ fontWeight: '800' }}>Hotline: 0889708303</span>
                        <span>Hỗ trợ bạn 24/7</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Slider;

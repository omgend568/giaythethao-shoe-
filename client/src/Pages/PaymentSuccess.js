import classNames from 'classnames/bind';
import styles from '../Styles/PaymentsSuccess.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { useEffect, useState } from 'react';
import request from '../Config/api';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const getOrderPayment = (order) => order?.Payments?.[0] || order?.Payment?.[0];

const getPaymentMethodLabel = (payment) => {
    if (!payment) return 'Không xác định';

    const method = (payment.method || '').toLowerCase();
    if (method === 'vnpay') return 'VNPay';
    if (method === 'cod') return 'Thanh toán khi nhận hàng (COD)';

    return Number(payment.status) === 1 ? 'Đã thanh toán online' : 'Thanh toán khi nhận hàng (COD)';
};

const formatPaymentDate = (payment) => {
    if (payment?.paidAt) {
        return new Date(payment.paidAt).toLocaleDateString('vi-VN');
    }
    return new Date().toLocaleDateString('vi-VN');
};

function PaymentSuccess() {
    const [dataPayment, setDataPayment] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const token = document.cookie;

    useEffect(() => {
        if (!token) {
            return;
        }
        request.get('/api/payment').then((res) => setDataPayment(res.data));
    }, [token]);

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <div className={cx('success-animation')}>
                    <svg className={cx('checkmark')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={cx('checkmark__circle')} cx="26" cy="26" r="25" fill="none" />
                        <path className={cx('checkmark__check')} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>
                {dataPayment.map((order) => {
                    const payment = getOrderPayment(order);

                    return (
                    <div key={order?.id} className={cx('content')}>
                        <h2>Thanh Toán Thành Công </h2>
                        <div className={cx('info')}>
                            <h3>Cảm ơn Quý Khách!</h3>
                            <span>
                                Chúng tôi xin thông báo rằng thanh toán của quý khách đã được xử lý thành công. Cảm ơn
                                quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi.
                            </span>
                            <ul>
                                Thông tin thanh toán
                                <li>Số tiền thanh toán : {formatPriceVN(getOrderPayment(order)?.amount || order?.total_price || 0)}</li>
                                <li>Ngày thanh toán: {formatPaymentDate(payment)}</li>
                                <li>
                                    Phương thức thanh toán: {getPaymentMethodLabel(payment)}
                                </li>
                            </ul>
                            <span>
                                Quý khách có thể kiểm tra chi tiết đơn hàng và theo dõi trạng thái vận chuyển trong tài
                                khoản của mình trên trang web của chúng tôi.
                            </span>
                            <span>
                                Nếu quý khách có bất kỳ câu hỏi hoặc cần hỗ trợ thêm, xin vui lòng liên hệ với đội ngũ
                                chăm sóc khách hàng của chúng tôi qua email [email] hoặc gọi điện thoại tới số [phone ].
                            </span>
                        </div>
                    </div>
                    );
                })}
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default PaymentSuccess;

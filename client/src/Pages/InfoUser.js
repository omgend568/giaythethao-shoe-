import classNames from 'classnames/bind';
import styles from '../Styles/InfoUser.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import request from '../Config/api';
import ModalCancelOrder from '../utils/Modal/CancelOrder';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

// Hàm kiểm tra xem đơn hàng có trong vòng 7 ngày đánh giá không
const isWithinReviewPeriod = (updatedAt) => {
    const orderDate = new Date(updatedAt);
    const now = new Date();
    const diffTime = now - orderDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
};

// Hàm kiểm tra đơn hàng có thể đánh giá không (đã giao, trong 7 ngày, chưa bị hủy/trả)
const canReviewOrder = (order) => {
    return order.delivery_status === 3 && // Đã giao hàng
        (order.status === 0 || order.status === 1) && // COD đã xác nhận hoặc đã thanh toán
        isWithinReviewPeriod(order.updatedAt || order.createdAt);
};

function InfoUser() {
    const navigate = useNavigate();
    const [dataUser, setDataUser] = useState({});
    const [dataPayments, setDataPayments] = useState([]);
    const [showModalCancelOrder, setShowModalCancelOrder] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewedOrderItems, setReviewedOrderItems] = useState(new Set());

    useEffect(() => {
        if (document.cookie) {
            request.get('/api/auth').then((res) => setDataUser(res.data));
        }
    }, []);

    const fetchPayments = async () => {
        if (document.cookie) {
            const res = await request.get('/api/payments');
            setDataPayments(res.data);

            // Lấy danh sách các order item đã được đánh giá (kể cả review bị ẩn)
            try {
                const reviewsRes = await request.get('/api/reviews/all');
                const reviewedIds = new Set(
                    reviewsRes.data
                        .filter(r => r.userId === dataUser?.id)
                        .map(r => r.orderItemId)
                );
                setReviewedOrderItems(reviewedIds);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [dataUser]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <div className={cx('info-user')}>
                    <div className={cx('inner')}>
                        <div className={cx('column-left')}>
                            <div className={cx('user-info-card')}>
                                <div className={cx('avatar-wrapper')}>
                                    <img
                                        src="https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o="
                                        alt=""
                                    />
                                </div>
                                <ul>
                                    <li id={cx('name')}>{dataUser?.fullname}</li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faEnvelope} />
                                        {dataUser?.email}
                                    </li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faLock} />
                                        **********
                                    </li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faPhone} />{dataUser?.phone}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className={cx('column-right')}>
                            <h2>Hoạt Động Gần Đây</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <div className={cx('table-wrapper')}>
                                    <table
                                        className={cx('styled-table')}
                                    >
                                    <thead>
                                        <tr>
                                            <th scope="col">Tên Sản Phẩm</th>
                                            <th scope="col">Size</th>
                                            <th scope="col">Số Lượng</th>
                                            <th scope="col">Tổng Tiền</th>
                                            <th scope="col">Trạng Thái</th>
                                            <th scope="col">Hành Động</th>
                                        </tr>
                                    </thead>
                                <tbody>
                                    {dataPayments.map((order) => (
                                        <>
                                            {order.OrderItems && order.OrderItems.map((item, index) => {
                                                const productId = item.ProductVariant?.Product?.id;
                                                // Kiểm tra điều kiện đánh giá:
                                                // 1. Đã giao hàng (delivery_status === 3)
                                                // 2. Trong 7 ngày kể từ ngày giao
                                                // 3. Chưa bị hủy/trả (status = 0 hoặc 1)
                                                // 4. Sản phẩm đã mua (productId tồn tại)
                                                // 5. Chưa được đánh giá
                                                const canReview = canReviewOrder(order) &&
                                                    productId &&
                                                    !reviewedOrderItems.has(item.id);

                                                return (
                                                <tr key={order.id || index}>
                                                    <td>{item.ProductVariant?.Product?.name}</td>
                                                    <td>{item.ProductVariant?.size || '-'}</td>
                                                    <td>{item.quantity}</td>
                                                    {index === 0 && (
                                                        <>
                                                            <td rowSpan={order.OrderItems.length}>
                                                                {formatPriceVN(order.total_price)}
                                                            </td>
                                                            {/* Trạng thái giao hàng */}
                                                            <td rowSpan={order.OrderItems.length}>
                                                                {order.delivery_status === 0 ? (
                                                                    <span className="badge bg-secondary">Chờ xác nhận</span>
                                                                ) : order.delivery_status === 1 ? (
                                                                    <span className="badge bg-info">Chuẩn bị hàng</span>
                                                                ) : order.delivery_status === 2 ? (
                                                                    <span className="badge bg-primary">Đang vận chuyển</span>
                                                                ) : order.delivery_status === 3 ? (
                                                                    <span className="badge bg-success">Đã giao</span>
                                                                ) : order.delivery_status === 4 ? (
                                                                    <span className="badge bg-danger">Đã hủy</span>
                                                                ) : order.delivery_status === 5 ? (
                                                                    <span className="badge bg-dark">Hoàn trả</span>
                                                                ) : (
                                                                    <span className="badge bg-secondary">Khác</span>
                                                                )}
                                                                <br />
                                                                <small className="text-muted">
                                                                    {order.status === 1 ? 'Đã thanh toán' : order.status === 0 && order.delivery_status === 3 ? 'Đã thanh toán (COD)' : order.status === 0 ? 'COD: Chưa thanh toán' : 'Hoàn tiền'}
                                                                </small>
                                                            </td>
                                                            <td rowSpan={order.OrderItems.length}>
                                                                {/* Nút Hủy: CHỈ khi delivery_status = 0 (chờ xác nhận) */}
                                                                {order.delivery_status === 0 && (
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        style={{ marginRight: '5px', marginBottom: '5px' }}
                                                                        onClick={() => {
                                                                            setSelectedOrder(order);
                                                                            setShowModalCancelOrder(true);
                                                                        }}
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                )}
                                                                {/* Nút đánh giá - CHỉ khi: đã giao (3) + trong 7 ngày + chưa đánh giá */}
                                                                {canReview && (
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        style={{ marginBottom: '5px' }}
                                                                        onClick={() => {
                                                                            navigate(`/product/${productId}/${item.ProductVariant?.Product?.slug || item.ProductVariant?.Product?.name}`);
                                                                        }}
                                                                    >
                                                                        Đánh giá
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                                );
                                            })}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            </div>
                        </div>
                        {showModalCancelOrder && selectedOrder && (
                            <ModalCancelOrder
                                show={showModalCancelOrder}
                                setShow={setShowModalCancelOrder}
                                item={selectedOrder}
                                onSuccess={fetchPayments}
                            />
                        )}
                    </div>
                </div>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default InfoUser;

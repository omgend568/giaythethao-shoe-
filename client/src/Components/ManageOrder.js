import classNames from 'classnames/bind';
import styles from '../Styles/ManageOrder.module.scss';
import Pagination from './Pagination';

import { useEffect, useState } from 'react';
import request from '../Config/api';
import ModalEditOrder from '../utils/Modal/ModalEditOrder';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalCancelOrder from '../utils/Modal/CancelOrder';

const cx = classNames.bind(styles);

// Hàm định dạng giá tiền Việt Nam
const formatPriceVN = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

function ManageOrder() {
    const [dataCart, setDataCart] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [idPro, setIdPro] = useState(0);
    const [address, setAddress] = useState('');
    const [currentStatus, setCurrentStatus] = useState({ deliveryStatus: 0, paymentMethod: '' });
    const [showModalCancelOrder, setShowModalCancelOrder] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const cartResponse = await request.get('/api/dataorderuser');
            setDataCart(cartResponse.data);
        };

        fetchData();
    }, [showModal, showModalCancelOrder]);

    const [page, setPage] = useState(1);
    const rowsPerPage = 50;
    const startIndex = (page - 1) * rowsPerPage;
    const totalPages = Math.ceil(dataCart.length / rowsPerPage);
    const currentProducts = dataCart.slice(startIndex, startIndex + rowsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleShowModalEdit = (id, address1, deliveryStatus, paymentMethod, orderStatus) => {
        setShowModal(!showModal);
        setIdPro(id);
        setAddress(address1);
        setCurrentStatus({ deliveryStatus, paymentMethod, status: orderStatus });
    };

    const handleShowModalCancelOrder = (item) => {
        setSelectedProduct(item);
        setShowModalCancelOrder(true);
    };

    return (
        <div className={cx('manage-product')}>
            <ToastContainer />
            <h2 style={{ fontSize: '25px', marginBottom: '20px' }}>Quản Lý Đơn Hàng</h2>
            <div className="table-responsive">
                <table className="table table-bordered border-primary">
                    <thead style={{ border: 'inherit' }} className="table-light">
                        <tr>
                            <th scope="col">Người Dùng</th>
                            <th scope="col">Số Điện Thoại</th>
                            <th scope="col">Địa Chỉ</th>
                            <th scope="col">Tên Sản Phẩm</th>
                            <th scope="col">Size</th>
                            <th scope="col">Số Lượng</th>
                            <th scope="col">Tổng Giá Tiền</th>
                            <th scope="col">Thanh Toán</th>
                            <th scope="col">Giao Hàng</th>
                            <th scope="col">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((order) =>
                            order.OrderItems && order.OrderItems.length > 0 && order.OrderItems.map((item, index) => (
                                <tr key={`${order.id}-${item.id || index}`}>
                                    {index === 0 && (
                                        <>
                                            <td rowSpan={order.OrderItems.length}>{order.User?.fullname}</td>
                                            <td rowSpan={order.OrderItems.length}>{order.User?.phone}</td>
                                            <td rowSpan={order.OrderItems.length}>{order.address}</td>
                                        </>
                                    )}
                                    <td>{item.ProductVariant?.Product?.name}</td>
                                    <td>{item.ProductVariant?.size || '-'}</td>
                                    <td>{item.quantity}</td>
                                    {index === 0 && (
                                        <>
                                            <td rowSpan={order.OrderItems.length}>{formatPriceVN(order.total_price)}</td>
                                            {/* Trạng thái thanh toán */}
                                            <td rowSpan={order.OrderItems.length}>
                                                {order.status === 1 ? (
                                                    <span className="badge bg-success">Đã thanh toán</span>
                                                ) : order.status === 0 && order.delivery_status === 3 ? (
                                                    <span className="badge bg-success">Đã thanh toán</span>
                                                ) : order.status === 0 ? (
                                                    <span className="badge bg-warning text-dark">Chưa thanh toán</span>
                                                ) : order.status === 2 ? (
                                                    <span className="badge bg-info">Hoàn tiền</span>
                                                ) : (
                                                    <span className="badge bg-secondary">Khác</span>
                                                )}
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
                                            </td>
                                            {/* Hành động */}
                                            <td rowSpan={order.OrderItems.length}>
                                                {order.delivery_status !== 3 && order.delivery_status !== 4 && order.delivery_status !== 5 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleShowModalEdit(order.id, order.address, order.delivery_status, order.Payment?.method, order.status)}
                                                            className="btn btn-primary btn-sm"
                                                            style={{ marginRight: '5px', marginBottom: '5px' }}
                                                        >
                                                            Tiếp Theo
                                                        </button>
                                                        <button
                                                            onClick={() => handleShowModalCancelOrder(order)}
                                                            className="btn btn-danger btn-sm"
                                                            style={{ marginBottom: '5px' }}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )),
                        )}
                    </tbody>
                </table>
                <div className={cx('pagination')}>
                    <Pagination page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
                </div>
            </div>
            <ModalEditOrder show={showModal} setShow={setShowModal} id={idPro} address={address} currentStatus={currentStatus} />
            <ModalCancelOrder
                show={showModalCancelOrder}
                setShow={setShowModalCancelOrder}
                item={selectedProduct}
                onSuccess={() => {
                    setShowModalCancelOrder(false);
                    setSelectedProduct({});
                }}
            />
        </div>
    );
}

export default ManageOrder;

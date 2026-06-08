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
    const productsPerPage = 5;
    const startIndex = (page - 1) * productsPerPage;
    const totalPages = Math.ceil(dataCart.length / productsPerPage);
    const currentProducts = dataCart.slice(startIndex, startIndex + productsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleShowModalEdit = (id, address1) => {
        setShowModal(!showModal);
        setIdPro(id);
        setAddress(address1);
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
                            <th scope="col">Tình Trạng</th>
                            <th scope="col">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((order) =>
                            order.OrderItems && order.OrderItems.map((item, index) => (
                                <tr key={order.id || index}>
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
                                            <td rowSpan={order.OrderItems.length}>
                                                {order.status === 2
                                                    ? 'Chuẩn Bị Hàng'
                                                    : order.status === 0
                                                    ? 'Đang Vận Chuyển'
                                                    : order.status === 1
                                                    ? 'Đã Giao Thành Công'
                                                    : order.status === 3
                                                    ? 'Đã Hủy'
                                                    : order.status === 6
                                                    ? 'Đã Hoàn Trả'
                                                    : order.status === 7
                                                    ? 'Hoàn Trả Một Phần'
                                                    : 'Chờ Xác Nhận'}
                                            </td>
                                            <td rowSpan={order.OrderItems.length}>
                                                {order.status !== 3 && order.status !== 1 && order.status !== 6 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleShowModalEdit(order.id)}
                                                            className="btn btn-primary"
                                                            style={{ marginRight: '10px' }}
                                                        >
                                                            Xác Nhận
                                                        </button>
                                                        <button
                                                            onClick={() => handleShowModalCancelOrder(order)}
                                                            className="btn btn-danger"
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
            <ModalEditOrder show={showModal} setShow={setShowModal} id={idPro} address={address} />
            <ModalCancelOrder
                show={showModalCancelOrder}
                setShow={setShowModalCancelOrder}
                item={selectedProduct}
                onSuccess={() => setShowModalCancelOrder(false)}
            />
        </div>
    );
}

export default ManageOrder;

import { useEffect, useState } from 'react';
import request from '../Config/api';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import classNames from 'classnames/bind';
import styles from '../Styles/ManagerUser.module.scss'; // Sử dụng cùng style

import Pagination from './Pagination';
import ModalHideComment from '../utils/Modal/ModalHideComment';

const cx = classNames.bind(styles);

function ManageComments() {
    const [dataAllComments, setDataAllComments] = useState([]);
    const [dataOneComment, setDataOneComment] = useState({});
    const [showHideModal, setShowHideModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [page, setPage] = useState(1);
    const rowsPerPage = 50;
    const startIndex = (page - 1) * rowsPerPage;
    const totalPages = Math.ceil(dataAllComments.length / rowsPerPage);
    const currentProducts = dataAllComments.slice(startIndex, startIndex + rowsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await request.get('/api/reviews/all');
                setDataAllComments(res.data);
            } catch (error) {
                console.error('Lỗi khi lấy bình luận:', error);
            }
        };
        fetchData();
    }, [refreshKey]);

    const showModalHideComment = (comment) => {
        setShowHideModal(true);
        setDataOneComment(comment);
    };

    const handleUnhideComment = async (comment) => {
        try {
            const res = await request.put('/api/reviews/unhide', null, {
                params: { id: comment.id }
            });
            toast.success(res.data.message);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi hiện bình luận');
        }
    };

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="table-responsive">
            <h4>Quản Lý Bình Luận và Đánh Giá</h4>
            <ToastContainer />
            <table className="table table-bordered border-primary table-hover mt-3">
                <thead>
                    <tr>
                        <th scope="col">Trạng Thái</th>
                        <th scope="col">Người Dùng</th>
                        <th scope="col">Bình Luận</th>
                        <th scope="col">Đánh Giá</th>
                        <th scope="col">Sản Phẩm</th>
                        <th scope="col">Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map((comment) => (
                        <tr key={comment.id} style={comment.is_hidden ? { opacity: 0.5, backgroundColor: '#f8d7da' } : {}}>
                            <td>
                                {comment.is_hidden ? (
                                    <span className="badge bg-secondary">Đã ẩn</span>
                                ) : (
                                    <span className="badge bg-success">Hiển thị</span>
                                )}
                            </td>
                            <td>{comment.user?.username || comment.user?.fullname || 'N/A'}</td>
                            <td>{comment.comment || <em className="text-muted">(Không có bình luận)</em>}</td>
                            <td>
                                <span className={`badge ${
                                    comment.rating >= 4 ? 'bg-success' : 
                                    comment.rating >= 3 ? 'bg-warning text-dark' : 
                                    'bg-danger'
                                }`}>
                                    {comment.rating}/5 sao
                                </span>
                            </td>
                            <td>{comment.product?.productName || comment.product?.name || 'N/A'}</td>
                            <td>
                                {comment.is_hidden ? (
                                    <button 
                                        onClick={() => handleUnhideComment(comment)} 
                                        type="button" 
                                        className="btn btn-success btn-sm"
                                    >
                                        Hiện Lại
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => showModalHideComment(comment)} 
                                        type="button" 
                                        className="btn btn-warning btn-sm"
                                    >
                                        Ẩn Bình Luận
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={cx('pagination')}>
                <Pagination page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
                <ModalHideComment 
                    show={showHideModal} 
                    setShow={setShowHideModal} 
                    dataOneComment={dataOneComment}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}

export default ManageComments;

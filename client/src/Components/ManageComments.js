import { useEffect, useState } from 'react';
import request from '../Config/api';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import classNames from 'classnames/bind';
import styles from '../Styles/ManagerUser.module.scss'; // Sử dụng cùng style

import Pagination from './Pagination';
import ModalDeleteComment from '../utils/Modal/ModalDeleteComment';

const cx = classNames.bind(styles);

function ManageComments() {
    const [dataAllComments, setDataAllComments] = useState([]);

    const [dataOneComment, setDataOneComment] = useState({});

    const [show, setShow] = useState(false);

    const [page, setPage] = useState(1);
    const productsPerPage = 10;
    const startIndex = (page - 1) * productsPerPage;
    const totalPages = Math.ceil(dataAllComments.length / productsPerPage);
    const currentProducts = dataAllComments.slice(startIndex, startIndex + productsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    useEffect(() => {
        const fetchData = async () => {
            const res = await request.get('/api/reviews/all');
            setDataAllComments(res.data);
        };
        fetchData();
    }, [show]);

    const showModalDeleteComment = (comment) => {
        setShow(true);
        setDataOneComment(comment);
    };

    return (
        <div className="table-responsive">
            <h4>Quản Lý Bình Luận và Đánh Giá</h4>
            <ToastContainer />
            <table className="table table-bordered border-primary table-hover mt-3">
                <thead>
                    <tr>
                     
                        <th scope="col">Người Dùng</th>
                        <th scope="col">Bình Luận</th>
                        <th scope="col">Đánh Giá</th>
                        <th scope="col">Sản Phẩm</th>
                        <th scope="col">Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map((comment) => (
                        <tr key={comment.id}>
                            
                            <td>{comment.user?.username || comment.user?.fullname || 'N/A'}</td>
                            <td>{comment.comment}</td>
                            <td>{comment.rating}/5</td>
                            <td>{comment.product?.productName || comment.product?.name || 'N/A'}</td>
                            <td>
                                <button onClick={() => showModalDeleteComment(comment)} type="button" className="btn btn-danger">
                                    Xóa Bình Luận
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={cx('pagination')}>
                <Pagination page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
                <ModalDeleteComment show={show} setShow={setShow} dataOneComment={dataOneComment} />
            </div>
        </div>
    );
}

export default ManageComments;
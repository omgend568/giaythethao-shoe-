import { useEffect, useState } from 'react';
import request from '../Config/api';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import classNames from 'classnames/bind';
import styles from '../Styles/ManagerUser.module.scss';

import Pagination from './Pagination';
import ModalLockUser from '../utils/Modal/ModalLockUser';

const cx = classNames.bind(styles);

function ManagerUser() {
    const [dataAllUser, setDataAllUser] = useState([]);

    const [dataOneUser, setDataOneUser] = useState({});

    const [showLock, setShowLock] = useState(false);
    const [isLocking, setIsLocking] = useState(true);

    const [page, setPage] = useState(1);
    const productsPerPage = 10;
    const startIndex = (page - 1) * productsPerPage;
    const totalPages = Math.ceil(dataAllUser.length / productsPerPage);
    const currentProducts = dataAllUser.slice(startIndex, startIndex + productsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    useEffect(() => {
        const fetchData = async () => {
            const res = await request.get('/api/getalluser');
            setDataAllUser(res.data);
        };
        fetchData();
    }, [showLock]);

    const showModalLockUser = (user, locking) => {
        setShowLock(true);
        setDataOneUser(user);
        setIsLocking(locking);
    };

    return (
        <div className="table-responsive">
            <h4>Quản Lý Người Dùng</h4>
            <ToastContainer />
            <table className="table table-bordered border-primary table-hover mt-3">
                <thead>
                    <tr>
                        <th scope="col">Tên Người Dùng</th>
                        <th scope="col">Email</th>
                        <th scope="col">Số Điện Thoại</th>
                        <th scope="col">Chức Vụ</th>
                        <th scope="col">Trạng Thái</th>
                        <th scope="col">Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map((user) => (
                        <tr key={user.id}>
                            <td>{user.fullname}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>{user.isAdmin ? 'Quản Trị Viên' : 'Người Dùng'}</td>
                            <td>
                                {user.isLocked ? (
                                    <span className={cx('status-locked')}>Đã Khóa</span>
                                ) : (
                                    <span className={cx('status-active')}>Hoạt Động</span>
                                )}
                            </td>
                            <td>
                                {!user.isAdmin && (
                                    <>
                                        {user.isLocked ? (
                                            <button
                                                onClick={() => showModalLockUser(user, false)}
                                                type="button"
                                                className="btn btn-success btn-sm me-2"
                                            >
                                                Mở Khóa
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => showModalLockUser(user, true)}
                                                type="button"
                                                className="btn btn-warning btn-sm me-2"
                                            >
                                                Khóa
                                            </button>
                                        )}
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={cx('pagination')}>
                <Pagination page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
                <ModalLockUser
                    show={showLock}
                    setShow={setShowLock}
                    dataOneUser={dataOneUser}
                    isLocking={isLocking}
                />
            </div>
        </div>
    );
}

export default ManagerUser;

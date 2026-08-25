import classNames from 'classnames/bind';
import styles from '../Styles/ManageProducts.module.scss';
import Pagination from './Pagination';

import React, { useState, useEffect } from 'react';
import AddCategory from '../Pages/Admin/ComponentsAdmin/AddProducts/AddCategory';
import ModalDeleteCategory from '../utils/Modal/DeleteCategory';
import ModalUpdateCategory from '../utils/Modal/ModalUpdateCategory';
import { ToastContainer } from 'react-toastify';

import request from '../Config/api';

const cx = classNames.bind(styles);

function ManageCategories({ checkOpenAddCategory, setCheckOpenAddCategory }) {
    const [page, setPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState({});
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showModalUpdate, setShowModalUpdate] = useState(false);
    const [dataCategories, setDataCategories] = useState([]);

    const rowsPerPage = 50;
    const startIndex = (page - 1) * rowsPerPage;
    const totalPages = Math.ceil(dataCategories.length / rowsPerPage);
    const currentCategories = dataCategories.slice(startIndex, startIndex + rowsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleShowModalDelete = (item) => {
        setSelectedCategory(item);
        setShowModalDelete(true);
    };

    const handleShowModalUpdate = (item) => {
        setSelectedCategory(item);
        setShowModalUpdate(true);
    };

    useEffect(() => {
        fetchData();
    }, [showModalDelete, showModalUpdate]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const categoriesResponse = await request.get('/api/all-categories');
            setDataCategories(categoriesResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    if (checkOpenAddCategory) {
        return <AddCategory setCheckOpenAddCategory={setCheckOpenAddCategory} />;
    }

    return (
        <div>
            <ToastContainer />
            <div className={cx('manage-product')}>
                <div className={cx('title')}>
                    <h2>Quản Lý Danh Mục</h2>
                    <div>
                        <button onClick={() => setCheckOpenAddCategory(true)} type="button" className="btn btn-primary">
                            Thêm Danh Mục
                        </button>
                    </div>
                </div>
                <div className="table-responsive mt-4">
                    <table className="table table-bordered border-primary">
                        <thead>
                            <tr>
                                <th scope="col">Tên Danh Mục</th>
                                <th scope="col">Tên Thương Hiệu</th>
                                <th scope="col">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCategories.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>
                                        {item.Brand?.name || `Brand #${item.brandId}`}
                                    </td>
                                    <td>
                                        <button
                                            style={{ marginRight: '15px' }}
                                            className="btn btn-danger"
                                            onClick={() => handleShowModalDelete(item)}
                                        >
                                            Xóa
                                        </button>
                                        <button
                                            className={cx('btn-update', 'btn', 'btn-warning')}
                                            onClick={() => handleShowModalUpdate(item)}
                                        >
                                            Sửa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className={cx('pagination')}>
                        <Pagination totalPages={totalPages} page={page} handlePageChange={handlePageChange} />
                    </div>
                </div>
            </div>
            <ModalDeleteCategory show={showModalDelete} setShow={setShowModalDelete} category={selectedCategory} />
            <ModalUpdateCategory show={showModalUpdate} setShow={setShowModalUpdate} data={selectedCategory} />
        </div>
    );
}

export default ManageCategories;

import className from 'classnames/bind';
import styles from './AddProducts.module.scss';
import { useState, useEffect } from 'react';
import request from '../../../../Config/api';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cx = className.bind(styles);

function AddCategory({ setCheckOpenAddCategory }) {
    const [name, setName] = useState('');
    const [brandId, setBrandId] = useState('');
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await request.get('/api/brands');
                setBrands(response.data);
            } catch (error) {
                console.log('Error fetching brands:', error);
                toast.error('Lỗi khi tải danh sách thương hiệu');
            }
        };
        fetchBrands();
    }, []);

    const handleAddCategory = async () => {
        if (!name || !brandId) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const response = await request.post('/api/add-category', {
                brandId: Number(brandId),
                name,
            });
            toast.success(response.data.message);
            clearForm();
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Lỗi khi thêm danh mục: ' + (error.response?.data?.message || error.message));
        }
    };

    const clearForm = () => {
        setName('');
        setBrandId('');
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <div className={cx('title')}>
                <h1>Thêm Danh Mục Sản Phẩm</h1>
                <button onClick={() => setCheckOpenAddCategory(false)} type="button" className="btn btn-primary">
                    Quay Lại
                </button>
            </div>
            <div className={cx('form')}>
                <div className={cx('form-group')}>
                    <label htmlFor="brand">Chọn Thương Hiệu</label>
                    <select
                        id="brand"
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="form-control"
                    >
                        <option value="">Chọn thương hiệu</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={cx('form-group')}>
                    <label htmlFor="name">Tên Danh Mục</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control"
                        placeholder="Nhập tên danh mục"
                    />
                </div>
                <div className={cx('form-group')}>
                    <button onClick={handleAddCategory} className="btn btn-success">
                        Thêm Danh Mục
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddCategory;

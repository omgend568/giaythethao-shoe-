import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalUpdateCategory({ show, setShow, data }) {
    const [nameCategory, setNameCategory] = useState('');
    const [brandId, setBrandId] = useState('');
    const [brands, setBrands] = useState([]);

    const handleClose = () => setShow(false);

    useEffect(() => {
        setNameCategory(data.name || '');
        setBrandId(data.brandId || '');
    }, [data]);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await request.get('/api/brands');
            setBrands(response.data);
        } catch (error) {
            console.error('Error fetching brands:', error);
        }
    };

    const handleUpdateCategory = async () => {
        if (!nameCategory || !brandId) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const res = await request.post('/api/edit-category', {
                id: data.id || data._id,
                name: nameCategory,
                brandId: brandId,
            });
            toast.success(res.data.message);
            handleClose();
        } catch (error) {
            const msg = error?.response?.data?.message || 'Lỗi cập nhật danh mục';
            toast.error(msg);
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <ToastContainer />
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh Sửa Danh Mục</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            className="form-control"
                            id="floatingNameCategory"
                            placeholder="Tên danh mục"
                            value={nameCategory}
                            onChange={(e) => setNameCategory(e.target.value)}
                        />
                        <label htmlFor="floatingNameCategory">Tên Danh Mục</label>
                    </div>
                    <div className="form-floating mb-3">
                        <select
                            className="form-select"
                            id="floatingBrand"
                            value={brandId}
                            onChange={(e) => setBrandId(e.target.value)}
                        >
                            <option value="">Chọn Thương Hiệu</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="floatingBrand">Tên Thương Hiệu</label>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleUpdateCategory}>
                        Cập Nhật Danh Mục
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalUpdateCategory;

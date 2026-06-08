import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalDeleteCategory({ show, setShow, category }) {
    const id = category.id || category._id;

    const handleClose = () => setShow(false);

    const handleDeleteCategory = async () => {
        try {
            const res = await request.delete('/api/delete-category', { params: { id: id } });
            toast.success(res.data.message);
            handleClose();
        } catch (error) {
            const msg = error?.response?.data?.message || 'Lỗi khi xóa danh mục';
            toast.error(msg);
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Xóa Danh Mục</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn muốn xóa danh mục có tên : {category.name}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleDeleteCategory}>
                        Xóa Danh Mục
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalDeleteCategory;

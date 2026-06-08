import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalCancelOrder({ show, setShow, item, onSuccess }) {
    const handleClose = () => setShow(false);

    const handleDeletePro = async () => {
        try {
            const res = await request.post('/api/cancelorder', { id: item.id });
            toast.success(res.data.message);
            setShow(false);
            if (typeof onSuccess === 'function') onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn');
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Hủy Đơn Hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn Muốn Hủy Đơn Hàng</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleDeletePro}>
                        Hủy Đơn Hàng
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalCancelOrder;

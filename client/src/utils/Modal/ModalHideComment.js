import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalHideComment({ show, setShow, dataOneComment, onSuccess }) {
    const handleClose = () => setShow(false);

    const handleHideComment = async () => {
        try {
            const res = await request.put('/api/reviews/hide', null, {
                params: { id: dataOneComment.id || dataOneComment._id }
            });
            toast.success(res.data.message);
            setShow(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi ẩn bình luận');
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>ẩn Bình Luận</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn muốn ẩn bình luận của: <strong>{dataOneComment.user?.fullname || 'Người dùng'}</strong>?
                    <br />
                    <small className="text-muted">Bình luận sẽ bị xóa với khách hàng và đánh giá trung bình sẽ được cập nhật lại.</small>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="warning" onClick={handleHideComment}>
                        Ẩn Bình Luận
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalHideComment;

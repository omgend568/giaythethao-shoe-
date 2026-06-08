import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalDeleteComment({ show, setShow, dataOneComment }) {
    const handleClose = () => setShow(false);

    const handleDeleteComment = async () => {
        try {
            const res = await request.delete('/api/reviews/delete', { 
                params: { id: dataOneComment.id || dataOneComment._id }
            });
            toast.success(res.data.message);
            setShow(false);
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Xóa Bình Luận</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn Muốn Xóa Bình Luận Của : {dataOneComment.user?.fullname || 'Người dùng'}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="danger" onClick={handleDeleteComment}>
                        Xóa Bình Luận
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalDeleteComment;
import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalLockUser({ show, setShow, dataOneUser, isLocking }) {
    const handleClose = () => setShow(false);

    const handleLockUnlockUser = async () => {
        try {
            const endpoint = isLocking ? '/api/lockuser' : '/api/unlockuser';
            const res = await request.post(endpoint, { id: dataOneUser.id || dataOneUser._id });
            toast.success(res.data.message);
            setShow(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{isLocking ? 'Khóa Tài Khoản' : 'Mở Khóa Tài Khoản'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLocking
                        ? `Bạn Muốn Khóa Tài Khoản Của: ${dataOneUser.fullname} ?`
                        : `Bạn Muốn Mở Khóa Tài Khoản Của: ${dataOneUser.fullname} ?`}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant={isLocking ? 'warning' : 'success'} onClick={handleLockUnlockUser}>
                        {isLocking ? 'Khóa Tài Khoản' : 'Mở Khóa Tài Khoản'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalLockUser;

import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalEditOrder({ show, setShow, id, address, currentStatus }) {
    const handleClose = () => setShow(false);

    const { deliveryStatus, paymentMethod, status: orderStatus } = currentStatus;

    // Tính bước tiếp theo dựa trên deliveryStatus hiện tại
    const getNextStep = () => {
        switch (deliveryStatus) {
            case 0: return { label: 'Xác nhận & Chuẩn bị hàng', value: 1 };
            case 1: return { label: 'Giao cho đơn vị vận chuyển', value: 2 };
            case 2: return { label: 'Xác nhận đã giao hàng', value: 3 };
            default: return null;
        }
    };

    const nextStep = getNextStep();

    const handleEditOrder = () => {
        if (!nextStep) return;

        request
            .post('/api/editorder', { valueOption: nextStep.value, id })
            .then((res) => {
                toast.success(res.data.message);
                setShow(false);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Cập nhật thất bại');
            });
    };

    const getPaymentStatusBadge = () => {
        // status = 1: Đã thanh toán (VNPay)
        // status = 0: Chưa thanh toán (COD)
        // status = 2: Hoàn tiền
        if (orderStatus === 1) {
            return <span className="badge bg-success">Thanh toán ngân hàng - Đã thanh toán</span>;
        } else if (orderStatus === 0) {
            return <span className="badge bg-warning text-dark">COD - Chưa thanh toán</span>;
        } else if (orderStatus === 2) {
            return <span className="badge bg-info">Đã hoàn tiền</span>;
        }
        return <span className="badge bg-secondary">Chưa xác định</span>;
    };

    if (!nextStep) {
        return null;
    }

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác Nhận Giao Hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <strong>Địa chỉ giao hàng:</strong>
                        <p className="mb-1">{address}</p>
                    </div>
                    
                    <div className="mb-3">
                        <strong>Phương thức thanh toán:</strong>
                        <div className="mt-1">{getPaymentStatusBadge()}</div>
                    </div>

                    <div className="alert alert-info mb-0">
                        <strong>Bước tiếp theo:</strong> {nextStep.label}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleEditOrder}>
                        Xác Nhận
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalEditOrder;

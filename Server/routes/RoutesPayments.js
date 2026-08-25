const express = require('express');
const router = express.Router();

const ControllerPayments = require('../controllers/ControllerPayments');

router.get('/payment', ControllerPayments.getPayment);
router.post('/paymentcod', ControllerPayments.PaymentCod);
router.get('/payments', ControllerPayments.getPayments);
router.get('/dataorderuser', ControllerPayments.GetOrderUser);
router.post('/cancelorder', ControllerPayments.CancelOrder);

router.post('/paymentvnpay', ControllerPayments.paymentVnpay);
router.get('/check-payment-vnpay', ControllerPayments.checkPaymentVnpay);

module.exports = router;

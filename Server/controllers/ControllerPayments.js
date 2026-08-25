const Cart = require('../models/ModelCart');
const CartItem = require('../models/ModelCartItem');
const ProductVariant = require('../models/ModelProductVariant');
const Product = require('../models/ModelProducts');
const Order = require('../models/ModelOrder');
const OrderItem = require('../models/ModelOrderItem');
const Payment = require('../models/ModelPayment');
const User = require('../models/ModelUser');
const Promotion = require('../models/ModelPromotion');
const PromotionUsage = require('../models/ModelPromotionUsage');
const { jwtDecode } = require('jwt-decode');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

require('dotenv').config();

async function syncUserCheckoutInfo(user, { name, phone, address }) {
    const updates = {};
    if (name?.trim()) updates.fullname = name.trim();
    if (phone?.trim()) updates.phone = phone.trim();
    if (address?.trim()) updates.address = address.trim();

    if (Object.keys(updates).length > 0) {
        await user.update(updates);
    }
}

async function calculateDiscount(promotionId, orderAmount, productIds, userId) {
    if (!promotionId) return 0;

    const promotion = await Promotion.findByPk(promotionId);
    if (!promotion || !promotion.is_active) return 0;

    const now = new Date();
    if (new Date(promotion.start_date) > now || new Date(promotion.end_date) < now) return 0;

    if (promotion.usage_limit) {
        const usageCount = await PromotionUsage.count({ where: { promotionId } });
        if (usageCount >= promotion.usage_limit) return 0;
    }

    if (promotion.usage_per_user && userId) {
        const userUsage = await PromotionUsage.count({ where: { promotionId, userId } });
        if (userUsage >= promotion.usage_per_user) return 0;
    }

    if (promotion.min_order_amount && orderAmount < promotion.min_order_amount) return 0;

    let discountAmount = 0;
    if (promotion.discount_type === 'percent') {
        discountAmount = (orderAmount * promotion.discount_value) / 100;
        if (promotion.max_discount_amount && discountAmount > promotion.max_discount_amount) {
            discountAmount = promotion.max_discount_amount;
        }
    } else {
        discountAmount = promotion.discount_value;
    }

    return Math.round(Math.min(discountAmount, orderAmount));
}

class ControllerPayments {
    // Map để lưu các request đang xử lý (dùng in-memory)
    // Key: cartId, Value: timestamp
    static processingPayments = new Map();

    async paymentVnpay(req, res) {
    try {
        const token = req.cookies.Token;
        if (!token) {
            return res.status(401).json({ message: 'bạn chưa đăng nhập' });
        }

        // Đảm bảo đã import: const { jwtDecode } = require('jwt-decode');
        const decoded = jwtDecode(token);
        if (!decoded || !decoded.email) {
            return res.status(400).json({ message: 'Token không hợp lệ' });
        }

        // Tìm User (Đảm bảo Model User đã có cột address như ta đã bàn)
        const dataUser = await User.findOne({ where: { email: decoded.email } });
        if (!dataUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        const userId = dataUser.id;

        // Kiểm tra cart có đang được xử lý không (chống double-submit)
        const existingCart = await Cart.findOne({ where: { userId } });
        if (existingCart && ControllerPayments.processingPayments.has(existingCart.id)) {
            const lastTime = ControllerPayments.processingPayments.get(existingCart.id);
            if (Date.now() - lastTime < 10000) { // 10 giây
                return res.status(429).json({ message: 'Đơn hàng đang được xử lý, vui lòng đợi...' });
            }
        }

        const dataCart = await Cart.findOne({
            where: { userId: userId },
            include: [{ 
                model: CartItem, 
                include: [{ model: ProductVariant, include: [Product] }] 
            }]
        });

        if (!dataCart || !dataCart.CartItems || dataCart.CartItems.length === 0) {
            return res.status(401).json({ message: 'Chưa thêm sản phẩm vào giỏ hàng' });
        }

        // Đánh dấu cart đang được xử lý
        ControllerPayments.processingPayments.set(dataCart.id, Date.now());

        // Tính tổng tiền
        const totalAmount = dataCart.CartItems.reduce(
            (sum, item) => sum + (parseFloat(item.price) * item.quantity),
            0
        );

        // Tính giảm giá nếu có promotion
        const productIds = dataCart.CartItems.map(item => item.ProductVariant?.productId).filter(Boolean);
        const discountAmount = await calculateDiscount(req.body.promotion_id, totalAmount, productIds, dataUser.id);
        const finalAmount = Math.max(0, totalAmount - discountAmount);

        // 2. SỬA LUỒNG ĐỊA CHỈ: 
        // Lấy từ body (khách nhập mới) HOẶC từ dataUser (địa chỉ mặc định)
        const finalAddress = req.body.address ;

        if (!finalAddress) {
            return res.status(400).json({ message: 'Bạn đang thiếu thông tin địa chỉ giao hàng' });
        }

        const phone = req.body?.phone?.trim();
        if (!phone && !dataUser.phone) {
            return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
        }

        await syncUserCheckoutInfo(dataUser, {
            name: req.body?.name,
            phone,
            address: finalAddress,
        });

        // 3. LƯU VÀO CART: (Đảm bảo Model Cart đã có cột address)
        await Cart.update({ 
            address: finalAddress,
            promotionId: req.body.promotion_id || null
        }, { where: { id: dataCart.id } });

        // Khởi tạo VNPay
        const vnpay = new VNPay({
            tmnCode: process.env.VNPAY_TMN_CODE,
            secureSecret: process.env.VNPAY_SECURE_SECRET,
            vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
            testMode: process.env.VNPAY_TEST_MODE !== 'false',
            hashAlgorithm: 'SHA512',
        });

        const now = new Date();
        const createDateStr = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
                                .replace(/[^\d]/g, '')
                                .slice(0, 14);

        const expire = new Date(now.getTime() + 15 * 60 * 1000); 
        const expireDateStr = expire.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
                                   .replace(/[^\d]/g, '')
                                   .slice(0, 14);

        // Tạo URL thanh toán
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5001}`;
        const urlString = vnpay.buildPaymentUrl({
            vnp_Amount: finalAmount, // Số tiền đã trừ giảm giá
            vnp_TxnRef: `${dataCart.id}_${Date.now()}`,
            vnp_OrderInfo: `Thanh toan don hang ${dataCart.id}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: `${serverUrl}/api/check-payment-vnpay`,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_IpAddr: '127.0.0.1',
            vnp_CreateDate: createDateStr,
            vnp_ExpireDate: expireDateStr,
        });
        return res.status(201).json({ paymentUrl: urlString });

    } catch (error) {
        // Xóa khỏi Map nếu có lỗi
        if (existingCart) {
            ControllerPayments.processingPayments.delete(existingCart.id);
        }
        console.error("❌ Lỗi tại paymentVnpay:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
}

    // Validate VNPAY signature helper
_validateVnPaySignature = (query) => {
    try {
        const vnp_SecureHash = query['vnp_SecureHash'];
        let vnp_Params = { ...query };

        // 1. CHỈ xóa duy nhất vnp_SecureHash và vnp_SecureHashType
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // 2. Sắp xếp key
        const sortedKeys = Object.keys(vnp_Params).sort();
        
        // 3. Tạo chuỗi băm
        // QUAN TRỌNG: VNPay 2.1.0 yêu cầu encode các tham số có dấu cách/ký tự đặc biệt 
        // TRƯỚC khi đưa vào chuỗi băm.
        const signData = sortedKeys
            .map((key) => {
                const value = vnp_Params[key];
                if (value === null || value === undefined) return '';
                // encodeURIComponent của JS biến dấu cách thành %20, 
                // nhưng VNPay yêu cầu dấu cách biến thành dấu +
                return `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
            })
            .filter(item => item !== '')
            .join('&');

      

        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha512', process.env.VNPAY_SECURE_SECRET || '');
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        

        return vnp_SecureHash.toLowerCase() === signed.toLowerCase();
    } catch (error) {
        console.error("Lỗi:", error);
        return false;
    }
}

checkPaymentVnpay = async (req, res) => {
    try {
        const query = req.query;
        const { vnp_ResponseCode, vnp_TxnRef } = query;
        const frontendUrl = process.env.REACT_APP_URL_DOMAIN || process.env.CLIENT_URL || 'http://localhost:3000';

        // 1. Kiểm tra chữ ký bảo mật
        const isValid = this._validateVnPaySignature(query);
        if (!isValid) {
            console.error('❌ Sai chữ ký VNPay!');
            return res.redirect(`${frontendUrl}/payment-error?message=invalid_signature`);
        }

        // 2. Nếu thanh toán thành công (Code 00)
        if (vnp_ResponseCode === '00') {
            const cartId = vnp_TxnRef ? vnp_TxnRef.split('_')[0] : null;

            if (!cartId) {
                return res.redirect(`${frontendUrl}/payment-error?message=no_cart_id`);
            }

            // Lấy thông tin giỏ hàng và User (Lấy luôn address ở đây)
            const cart = await Cart.findOne({
                where: { id: cartId },
                include: [
                    { 
                        model: CartItem, 
                        include: [{ model: ProductVariant, include: [Product] }] 
                    }, 
                    { model: User }
                ]
            });

            if (!cart) {
                return res.redirect(`${frontendUrl}/payment-error?message=cart_not_found`);
            }

            // Tính tổng tiền
            const totalPrice = cart.CartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Tính giảm giá nếu có promotion trong cart
            const productIds = cart.CartItems.map(item => item.ProductVariant?.productId).filter(Boolean);
            const discountAmount = await calculateDiscount(cart.promotionId, totalPrice, productIds, cart.userId);
            const finalPrice = Math.max(0, totalPrice - discountAmount);

            // ĐỊA CHỈ: Ưu tiên địa chỉ trong Cart (đã lưu ở bước tạo link), sau đó tới User address
            const finalAddress = cart.address || (cart.User ? cart.User.address : 'Địa chỉ mặc định');

            // --- LƯU VÀO DATABASE ---
            const order = await Order.create({
                userId: cart.userId,
                address: finalAddress, 
                subtotal: totalPrice,
                discount_amount: discountAmount,
                total_price: finalPrice,
                promotionId: cart.promotionId,
                status: 1, // VNPay đã thanh toán
                delivery_status: 0, // Chờ xác nhận giao hàng
            });

            // Ghi nhận sử dụng promotion
            if (cart.promotionId && discountAmount > 0) {
                await PromotionUsage.create({
                    promotionId: cart.promotionId,
                    userId: cart.userId,
                    orderId: order.id,
                    discount_amount: discountAmount,
                    usedAt: new Date(),
                });
            }

            // Tạo các Order Items
            await Promise.all(
                cart.CartItems.map((item) =>
                    OrderItem.create({
                        orderId: order.id,
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        price: item.price,
                    })
                )
            );

            // Tạo bản ghi Payment
            await Payment.create({
                orderId: order.id,
                method: 'vnpay',
                amount: finalPrice,
                status: 1, 
                paidAt: new Date(),
            });

            // Xóa sạch giỏ hàng
            const cartIdToDelete = cart.id; // Giữ lại ID trước khi destroy
            await CartItem.destroy({ where: { cartId: cartIdToDelete } });
            // --- CHUYỂN HƯỚNG VỀ FRONTEND ---
            return res.redirect(`${frontendUrl}/paymentsuccess`);

        } else {
            console.log('❌ Thanh toán thất bại. Code:', vnp_ResponseCode);
            return res.redirect(`${frontendUrl}/payment-error?code=${vnp_ResponseCode}`);
        }

    } catch (error) {
        console.error('❌ Lỗi hệ thống tại checkPaymentVnpay:', error);
        return res.status(500).send('Internal Server Error');
    }
}

    async getPayment(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const decoded = jwtDecode(token);
            if (!decoded || !decoded.email) {
                return res.status(400).json({ message: 'Invalid token' });
            }

            const dataUser = await User.findOne({ where: { email: decoded.email } });

            if (!dataUser) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            // Get latest order for this user, include orderitems and payment
            const order = await Order.findOne({
                where: { userId: dataUser.id },
                order: [['id', 'DESC']],
                include: [
                    { model: OrderItem, include: [{ model: ProductVariant, include: [Product] }] },
                    { model: Payment },
                    { model: User, attributes: ['id', 'fullname', 'email', 'phone'] }
                ]
            });
            return res.status(200).json(order ? [order] : []);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async PaymentCod(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const decoded = jwtDecode(token);
            if (!decoded || !decoded.email) {
                return res.status(400).json({ message: 'Invalid token' });
            }

            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            // Kiểm tra cart có đang được xử lý không (chống double-submit)
            const existingCart = await Cart.findOne({ where: { userId: dataUser.id } });
            if (existingCart && ControllerPayments.processingPayments.has(existingCart.id)) {
                const lastTime = ControllerPayments.processingPayments.get(existingCart.id);
                if (Date.now() - lastTime < 10000) { // 10 giây
                    return res.status(429).json({ message: 'Đơn hàng đang được xử lý, vui lòng đợi...' });
                }
            }

            const cart = await Cart.findOne({
                where: { userId: dataUser.id },
                include: [{ model: CartItem, include: [{ model: ProductVariant, include: [Product] }] }]
            });
            if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
                return res.status(404).json({ message: 'Cart is empty' });
            }

            // Đánh dấu cart đang được xử lý
            ControllerPayments.processingPayments.set(cart.id, Date.now());

            const address = req.body?.address || dataUser.address || null;
            if (!address) {
                return res.status(403).json({ message: 'Bạn đang thiếu thông tin địa chỉ' });
            }

            const phone = req.body?.phone?.trim();
            if (!phone && !dataUser.phone) {
                return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
            }

            await syncUserCheckoutInfo(dataUser, {
                name: req.body?.name,
                phone,
                address,
            });

            // Tính tổng tiền
            const totalPrice = cart.CartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Tính giảm giá nếu có promotion
            const productIds = cart.CartItems.map(item => item.ProductVariant?.productId).filter(Boolean);
            const discountAmount = await calculateDiscount(req.body.promotion_id, totalPrice, productIds, dataUser.id);
            const finalPrice = Math.max(0, totalPrice - discountAmount);

            // Tạo Order
            const order = await Order.create({
                userId: dataUser.id,
                address: address || 'dia chỉ mặc định',
                subtotal: totalPrice,
                discount_amount: discountAmount,
                total_price: finalPrice,
                promotionId: req.body.promotion_id || null,
                status: 0, // COD chưa thanh toán
                delivery_status: 0, // Chờ xác nhận giao hàng
            });

            // Tạo OrderItems từ CartItems
            await Promise.all(
                cart.CartItems.map((item) =>
                    OrderItem.create({
                        orderId: order.id,
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        price: item.price,
                    })
                )
            );

            // Ghi nhận sử dụng promotion
            if (req.body.promotion_id && discountAmount > 0) {
                await PromotionUsage.create({
                    promotionId: req.body.promotion_id,
                    userId: dataUser.id,
                    orderId: order.id,
                    discount_amount: discountAmount,
                    usedAt: new Date(),
                });
            }

            // Tạo Payment gắn vào Order (COD)
            await Payment.create({
                orderId: order.id,
                method: 'cod',
                amount: finalPrice,
                status: 0,
                paidAt: null,
            });

            // Xóa cart sau khi hoàn tất
            ControllerPayments.processingPayments.delete(cart.id);
            await cart.destroy();
            res.status(200).json({ message: 'Thanh Toán Thành Công !!!' });
        } catch (error) {
            // Xóa khỏi Map nếu có lỗi
            if (existingCart) {
                ControllerPayments.processingPayments.delete(existingCart.id);
            }
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async getPayments(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const decoded = jwtDecode(token);
            if (!decoded || !decoded.email) {
                return res.status(400).json({ message: 'Invalid token' });
            }

            const dataUser = await User.findOne({ where: { email: decoded.email } });

            if (!dataUser) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            const orders = await Order.findAll({
                where: { userId: dataUser.id },
                include: [
                    { model: OrderItem, include: [{ model: ProductVariant, include: [Product] }] },
                    { model: Payment },
                    { model: User, attributes: ['id', 'fullname', 'email', 'phone'] }
                ],
                order: [['id', 'DESC']],
            });
            return res.status(200).json(orders);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async GetOrderUser(req, res) {
        try {
            const orders = await Order.findAll({
                include: [
                    { model: OrderItem, include: [{ model: ProductVariant, include: [Product] }] },
                    { model: Payment },
                    { model: User, attributes: ['id', 'fullname', 'email', 'phone'] }
                ],
                order: [['createdAt', 'DESC']],
            });
            return res.status(200).json(orders);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async CancelOrder(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.body;

            // authenticate user
            const token = req.cookies.Token;
            if (!token) {
                await transaction.rollback();
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const decoded = jwtDecode(token);
            if (!decoded || !decoded.email) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Invalid token' });
            }

            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            const order = await Order.findOne({ where: { id } });
            if (!order) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
            }

            // only owner or admin can cancel
            if (!dataUser.isAdmin && order.userId !== dataUser.id) {
                await transaction.rollback();
                return res.status(403).json({ message: 'Bạn không có quyền hủy đơn này' });
            }

            // if admin, perform original deletion behaviour
            if (dataUser.isAdmin) {
                // Hoàn tiền nếu là VNPay trước khi xóa
                const payment = await Payment.findOne({ where: { orderId: id } });
                if (payment && payment.method === 'vnpay' && payment.status === 1) {
                    await Payment.update({ status: 2 }, { where: { orderId: id } });
                }

                // HOÀN STOCK vì stock đã bị trừ khi xác nhận chuẩn bị hàng
                const orderItems = await OrderItem.findAll({ where: { orderId: id } });
                for (const item of orderItems) {
                    const variant = await ProductVariant.findByPk(item.productVariantId, {
                        transaction,
                        lock: transaction.LOCK.UPDATE,
                    });

                    if (variant) {
                        const currentStock = parseInt(variant.stock, 10) || 0;
                        const qty = parseInt(item.quantity, 10) || 0;
                        await variant.update({ stock: currentStock + qty }, { transaction });
                    }
                }

                await OrderItem.destroy({ where: { orderId: id }, transaction });
                await Payment.destroy({ where: { orderId: id }, transaction });
                await order.destroy({ transaction });
                await transaction.commit();
                return res.status(200).json({ message: 'Hủy đơn hàng (admin) thành công !!!' });
            }

            // for regular user, only allow cancel if not delivered
            if (order.delivery_status === 3) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Không thể hủy đơn đã giao' });
            }

            // HOÀN STOCK vì stock đã bị trừ khi xác nhận chuẩn bị hàng (delivery_status >= 1)
            if (order.delivery_status >= 1) {
                const orderItems = await OrderItem.findAll({ where: { orderId: id } });
                for (const item of orderItems) {
                    const variant = await ProductVariant.findByPk(item.productVariantId, {
                        transaction,
                        lock: transaction.LOCK.UPDATE,
                    });

                    if (variant) {
                        const currentStock = parseInt(variant.stock, 10) || 0;
                        const qty = parseInt(item.quantity, 10) || 0;
                        await variant.update({ stock: currentStock + qty }, { transaction });
                    }
                }
            }

            // mark as cancelled
            order.delivery_status = 4;
            await order.save({ transaction });

            // Hoàn tiền nếu là VNPay
            const payment = await Payment.findOne({ where: { orderId: id } });
            if (payment && payment.method === 'vnpay' && payment.status === 1) {
                await Payment.update({ status: 2 }, { where: { orderId: id } }, { transaction });
            }

            await transaction.commit();
            return res.status(200).json({ message: 'Hủy đơn hàng thành công !!!' });
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerPayments();

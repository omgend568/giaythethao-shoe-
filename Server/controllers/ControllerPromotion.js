const Promotion = require('../models/ModelPromotion');
const PromotionProduct = require('../models/ModelPromotionProduct');
const PromotionUsage = require('../models/ModelPromotionUsage');
const Product = require('../models/ModelProducts');
const User = require('../models/ModelUser');
const Order = require('../models/ModelOrder');
const { Op } = require('sequelize');

class ControllerPromotion {
    // Get active promotions for display (user-facing)
    GetActivePromotions = async (req, res) => {
        try {
            const now = new Date();
            const promotions = await Promotion.findAll({
                where: {
                    is_active: true,
                    start_date: { [Op.lte]: now },
                    end_date: { [Op.gte]: now }
                },
                attributes: ['id', 'code', 'name', 'description', 'discount_type', 'discount_value', 'min_order_amount', 'max_discount_amount'],
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json(promotions);
        } catch (error) {
            console.error('Lỗi GetActivePromotions:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Generate random coupon code
    generateCode(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create a new promotion/coupon
    CreatePromotion = async (req, res) => {
        try {
            const {
                name,
                description,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount_amount,
                usage_limit,
                usage_per_user,
                start_date,
                end_date,
                is_active,
                product_ids
            } = req.body;

            if (!name || !discount_type || !discount_value || !start_date || !end_date) {
                return res.status(400).json({ message: 'Các trường bắt buộc không được để trống' });
            }

            // Validate date range
            if (new Date(end_date) < new Date(start_date)) {
                return res.status(400).json({ message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu' });
            }

            if (!['percent', 'fixed'].includes(discount_type)) {
                return res.status(400).json({ message: 'discount_type phải là "percent" hoặc "fixed"' });
            }

            if (discount_type === 'percent' && (discount_value < 1 || discount_value > 100)) {
                return res.status(400).json({ message: 'Giảm theo % phải từ 1 đến 100' });
            }

            // Generate unique code
            let code = this.generateCode();
            let isUnique = false;
            while (!isUnique) {
                const existing = await Promotion.findOne({ where: { code } });
                if (!existing) {
                    isUnique = true;
                } else {
                    code = this.generateCode();
                }
            }

            const promotion = await Promotion.create({
                code,
                name,
                description,
                discount_type,
                discount_value,
                min_order_amount: min_order_amount || 0,
                max_discount_amount,
                usage_limit,
                usage_per_user: usage_per_user || 1,
                start_date,
                end_date,
                is_active: is_active !== false
            });

            // Link products if provided
            if (product_ids && product_ids.length > 0) {
                await PromotionProduct.bulkCreate(
                    product_ids.map(pid => ({
                        promotionId: promotion.id,
                        productId: pid
                    }))
                );
            }

            return res.status(201).json({
                message: 'Tạo mã khuyến mãi thành công',
                promotion
            });
        } catch (error) {
            console.error('Lỗi createPromotion:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get all promotions (for admin)
    GetAllPromotions = async (req, res) => {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = {};
            const now = new Date();

            if (status === 'active') {
                whereClause = {
                    is_active: true,
                    start_date: { [Op.lte]: now },
                    end_date: { [Op.gte]: now }
                };
            } else if (status === 'expired') {
                whereClause = {
                    end_date: { [Op.lt]: now }
                };
            } else if (status === 'upcoming') {
                whereClause = {
                    start_date: { [Op.gt]: now }
                };
            }

            const { count, rows } = await Promotion.findAndCountAll({
                where: whereClause,
                include: [{
                    model: PromotionProduct,
                    as: 'PromotionProducts',
                    include: [{
                        model: Product,
                        attributes: ['id', 'name']
                    }]
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true
            });

            // Get usage stats for each promotion
            const promotionsWithStats = await Promise.all(rows.map(async (promo) => {
                const usageCount = await PromotionUsage.count({ where: { promotionId: promo.id } });
                const promoJson = promo.toJSON();
                return {
                    ...promoJson,
                    usage_count: usageCount,
                    remaining_uses: promo.usage_limit ? promo.usage_limit - usageCount : null
                };
            }));

            return res.status(200).json({
                promotions: promotionsWithStats,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Lỗi getAllPromotions:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get promotion by ID
    GetPromotionById = async (req, res) => {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'id là bắt buộc' });
            }

            const promotion = await Promotion.findOne({
                where: { id },
                include: [{
                    model: PromotionProduct,
                    as: 'PromotionProducts',
                    include: [{
                        model: Product,
                        attributes: ['id', 'name', 'price']
                    }]
                }]
            });

            if (!promotion) {
                return res.status(404).json({ message: 'Khuyến mãi không tồn tại' });
            }

            const usageCount = await PromotionUsage.count({ where: { promotionId: promotion.id } });

            return res.status(200).json({
                ...promotion.toJSON(),
                usage_count: usageCount,
                remaining_uses: promotion.usage_limit ? promotion.usage_limit - usageCount : null
            });
        } catch (error) {
            console.error('Lỗi getPromotionById:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get promotion by code (for customers)
    GetPromotionByCode = async (req, res) => {
        try {
            const { code } = req.query;

            if (!code) {
                return res.status(400).json({ message: 'code là bắt buộc' });
            }

            const promotion = await Promotion.findOne({
                where: {
                    code: code.toUpperCase(),
                    is_active: true
                }
            });

            if (!promotion) {
                return res.status(404).json({ message: 'Mã khuyến mãi không hợp lệ' });
            }

            const now = new Date();
            if (new Date(promotion.start_date) > now) {
                return res.status(400).json({ message: 'Mã khuyến mãi chưa bắt đầu' });
            }
            if (new Date(promotion.end_date) < now) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết hạn' });
            }

            // Check usage limit
            if (promotion.usage_limit) {
                const usageCount = await PromotionUsage.count({ where: { promotionId: promotion.id } });
                if (usageCount >= promotion.usage_limit) {
                    return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng' });
                }
            }

            return res.status(200).json({
                id: promotion.id,
                code: promotion.code,
                name: promotion.name,
                description: promotion.description,
                discount_type: promotion.discount_type,
                discount_value: promotion.discount_value,
                min_order_amount: promotion.min_order_amount,
                max_discount_amount: promotion.max_discount_amount
            });
        } catch (error) {
            console.error('Lỗi getPromotionByCode:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Validate and calculate discount
    ValidatePromotion = async (req, res) => {
        try {
            const { code, userId, order_amount, product_ids } = req.body;

            if (!code || !order_amount) {
                return res.status(400).json({ message: 'code và order_amount là bắt buộc' });
            }

            const promotion = await Promotion.findOne({
                where: {
                    code: code.toUpperCase(),
                    is_active: true
                },
                include: [{
                    model: PromotionProduct,
                    as: 'PromotionProducts'
                }]
            });

            if (!promotion) {
                return res.status(404).json({ message: 'Mã khuyến mãi không hợp lệ', valid: false });
            }

            const now = new Date();
            if (new Date(promotion.start_date) > now) {
                return res.status(400).json({ message: 'Mã khuyến mãi chưa bắt đầu', valid: false });
            }
            if (new Date(promotion.end_date) < now) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết hạn', valid: false });
            }

            // Check global usage limit
            if (promotion.usage_limit) {
                const usageCount = await PromotionUsage.count({ where: { promotionId: promotion.id } });
                if (usageCount >= promotion.usage_limit) {
                    return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng', valid: false });
                }
            }

            // Check per-user usage limit
            if (userId && promotion.usage_per_user) {
                const userUsageCount = await PromotionUsage.count({
                    where: { promotionId: promotion.id, userId }
                });
                if (userUsageCount >= promotion.usage_per_user) {
                    return res.status(400).json({
                        message: `Bạn đã sử dụng mã này ${promotion.usage_per_user} lần`,
                        valid: false
                    });
                }
            }

            // Check min order amount
            if (promotion.min_order_amount && parseFloat(order_amount) < parseFloat(promotion.min_order_amount)) {
                return res.status(400).json({
                    message: `Đơn hàng tối thiểu ${promotion.min_order_amount}đ để áp dụng mã này`,
                    valid: false
                });
            }

            // Check product-specific promotion
            let applicableAmount = parseFloat(order_amount);
            if (promotion.PromotionProducts && promotion.PromotionProducts.length > 0) {
                if (!product_ids || product_ids.length === 0) {
                    return res.status(400).json({
                        message: 'Mã khuyến mãi chỉ áp dụng cho sản phẩm nhất định',
                        valid: false
                    });
                }
                // Filter applicable products
                const promoProductIds = promotion.PromotionProducts.map(p => p.productId);
                const hasApplicableProduct = product_ids.some(id => promoProductIds.includes(parseInt(id)));
                if (!hasApplicableProduct) {
                    return res.status(400).json({
                        message: 'Mã khuyến mãi không áp dụng cho sản phẩm trong giỏ hàng',
                        valid: false
                    });
                }
            }

            // Calculate discount
            let discountAmount = 0;
            if (promotion.discount_type === 'percent') {
                discountAmount = (applicableAmount * parseFloat(promotion.discount_value)) / 100;
                if (promotion.max_discount_amount && discountAmount > parseFloat(promotion.max_discount_amount)) {
                    discountAmount = parseFloat(promotion.max_discount_amount);
                }
            } else {
                discountAmount = parseFloat(promotion.discount_value);
            }

            return res.status(200).json({
                valid: true,
                promotion: {
                    id: promotion.id,
                    code: promotion.code,
                    name: promotion.name,
                    discount_type: promotion.discount_type,
                    discount_value: promotion.discount_value,
                    max_discount_amount: promotion.max_discount_amount
                },
                discount_amount: Math.round(discountAmount),
                final_amount: Math.round(applicableAmount - discountAmount)
            });
        } catch (error) {
            console.error('Lỗi validatePromotion:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Apply promotion and calculate discount
    ApplyPromotion = async (req, res) => {
        try {
            const { code, order_amount, product_ids } = req.body;

            if (!code || order_amount === undefined) {
                return res.status(400).json({ message: 'Mã khuyến mãi và số tiền đơn hàng là bắt buộc' });
            }

            const promotion = await Promotion.findOne({
                where: {
                    code: code.toUpperCase(),
                    is_active: true
                },
                include: [{
                    model: PromotionProduct,
                    as: 'PromotionProducts'
                }]
            });

            if (!promotion) {
                return res.status(404).json({ message: 'Mã khuyến mãi không hợp lệ' });
            }

            const now = new Date();
            if (new Date(promotion.start_date) > now) {
                return res.status(400).json({ message: 'Mã khuyến mãi chưa bắt đầu' });
            }
            if (new Date(promotion.end_date) < now) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết hạn' });
            }

            // Check product restrictions
            if (promotion.PromotionProducts && promotion.PromotionProducts.length > 0 && product_ids && product_ids.length > 0) {
                const restrictedProductIds = promotion.PromotionProducts.map(p => p.productId);
                const hasMatchingProduct = product_ids.some(pid => restrictedProductIds.includes(pid));
                if (!hasMatchingProduct) {
                    return res.status(400).json({
                        message: 'Mã khuyến mãi này chỉ áp dụng cho một số sản phẩm nhất định trong giỏ hàng'
                    });
                }
            }

            // Check global usage limit
            if (promotion.usage_limit) {
                const usageCount = await PromotionUsage.count({ where: { promotionId: promotion.id } });
                if (usageCount >= promotion.usage_limit) {
                    return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng' });
                }
            }

            // Check per-user usage limit
            const decoded = req.cookies?.Token ? require('jwt-decode').jwtDecode(req.cookies.Token) : null;
            const userId = decoded?.id;
            if (userId && promotion.usage_per_user) {
                const userUsageCount = await PromotionUsage.count({
                    where: { promotionId: promotion.id, userId }
                });
                if (userUsageCount >= promotion.usage_per_user) {
                    return res.status(400).json({
                        message: `Bạn đã sử dụng mã này ${promotion.usage_per_user} lần`
                    });
                }
            }

            // Check min order amount
            if (promotion.min_order_amount && parseFloat(order_amount) < parseFloat(promotion.min_order_amount)) {
                return res.status(400).json({
                    message: `Đơn hàng tối thiểu ${ControllerPromotion.formatPriceServer(promotion.min_order_amount)} để áp dụng mã này`
                });
            }

            // Calculate discount
            let discountAmount = 0;
            if (promotion.discount_type === 'percent') {
                discountAmount = (parseFloat(order_amount) * promotion.discount_value) / 100;
                if (promotion.max_discount_amount && discountAmount > parseFloat(promotion.max_discount_amount)) {
                    discountAmount = parseFloat(promotion.max_discount_amount);
                }
            } else {
                discountAmount = parseFloat(promotion.discount_value);
            }

            discountAmount = Math.min(discountAmount, parseFloat(order_amount));

            return res.status(200).json({
                promotion: {
                    id: promotion.id,
                    code: promotion.code,
                    name: promotion.name,
                    discount_type: promotion.discount_type,
                    discount_value: promotion.discount_value
                },
                discount_amount: discountAmount,
                original_amount: parseFloat(order_amount),
                final_amount: parseFloat(order_amount) - discountAmount
            });
        } catch (error) {
            console.error('Lỗi applyPromotion:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    static formatPriceServer = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Update promotion
    UpdatePromotion = async (req, res) => {
        try {
            const {
                id,
                name,
                description,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount_amount,
                usage_limit,
                usage_per_user,
                start_date,
                end_date,
                is_active,
                product_ids
            } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'id là bắt buộc' });
            }

            const promotion = await Promotion.findByPk(id);
            if (!promotion) {
                return res.status(404).json({ message: 'Khuyến mãi không tồn tại' });
            }

            // Validate date range if both dates are provided
            const currentStartDate = start_date || promotion.start_date;
            const currentEndDate = end_date || promotion.end_date;
            if (new Date(currentEndDate) < new Date(currentStartDate)) {
                return res.status(400).json({ message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu' });
            }

            await promotion.update({
                name: name || promotion.name,
                description: description !== undefined ? description : promotion.description,
                discount_type: discount_type || promotion.discount_type,
                discount_value: discount_value !== undefined ? discount_value : promotion.discount_value,
                min_order_amount: min_order_amount !== undefined ? min_order_amount : promotion.min_order_amount,
                max_discount_amount: max_discount_amount !== undefined ? max_discount_amount : promotion.max_discount_amount,
                usage_limit: usage_limit !== undefined ? usage_limit : promotion.usage_limit,
                usage_per_user: usage_per_user !== undefined ? usage_per_user : promotion.usage_per_user,
                start_date: start_date || promotion.start_date,
                end_date: end_date || promotion.end_date,
                is_active: is_active !== undefined ? is_active : promotion.is_active
            });

            // Update product links if provided
            if (product_ids !== undefined) {
                await PromotionProduct.destroy({ where: { promotionId: id } });
                if (product_ids && product_ids.length > 0) {
                    await PromotionProduct.bulkCreate(
                        product_ids.map(pid => ({
                            promotionId: id,
                            productId: pid
                        }))
                    );
                }
            }

            return res.status(200).json({
                message: 'Cập nhật khuyến mãi thành công',
                promotion
            });
        } catch (error) {
            console.error('Lỗi updatePromotion:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Delete promotion (hard delete)
    DeletePromotion = async (req, res) => {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'id là bắt buộc' });
            }

            const promotion = await Promotion.findByPk(id);
            if (!promotion) {
                return res.status(404).json({ message: 'Khuyến mãi không tồn tại' });
            }

            // Delete related records first
            await PromotionProduct.destroy({ where: { promotionId: id } });
            await PromotionUsage.destroy({ where: { promotionId: id } });
            
            // Delete the promotion
            await promotion.destroy();

            return res.status(200).json({ message: 'Xóa khuyến mãi thành công' });
        } catch (error) {
            console.error('Lỗi deletePromotion:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get promotion usage history (for admin)
    GetPromotionUsageHistory = async (req, res) => {
        try {
            const { promotionId, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = {};
            if (promotionId) {
                whereClause.promotionId = promotionId;
            }

            const { count, rows } = await PromotionUsage.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Promotion,
                        attributes: ['id', 'code', 'name']
                    },
                    {
                        model: User,
                        attributes: ['id', 'fullname', 'email']
                    },
                    {
                        model: Order,
                        attributes: ['id', 'total_amount']
                    }
                ],
                order: [['usedAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return res.status(200).json({
                usages: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Lỗi getPromotionUsageHistory:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Toggle promotion active status
    TogglePromotionStatus = async (req, res) => {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'id là bắt buộc' });
            }

            const promotion = await Promotion.findByPk(id);
            if (!promotion) {
                return res.status(404).json({ message: 'Khuyến mãi không tồn tại' });
            }

            await promotion.update({ is_active: !promotion.is_active });

            return res.status(200).json({
                message: promotion.is_active ? 'Kích hoạt khuyến mãi thành công' : 'Vô hiệu hóa khuyến mãi thành công',
                is_active: promotion.is_active
            });
        } catch (error) {
            console.error('Lỗi togglePromotionStatus:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerPromotion();

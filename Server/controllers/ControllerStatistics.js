const { Op } = require('sequelize');
const { Order, OrderItem, ProductVariant, Product, Brand, Category } = require('../models/associations');
const { sequelize } = require('../config/db');

class ControllerStatistics {
    // Thống kê tổng quan
    async getOverview(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Build date filter
            const dateFilter = {};
            if (startDate) {
                dateFilter[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                dateFilter[Op.lte] = new Date(endDate + ' 23:59:59');
            }

            // Filter only completed orders (delivery_status = 3: Đã giao)
            const orderFilter = { delivery_status: 3 };
            if (startDate || endDate) {
                orderFilter.createdAt = dateFilter;
            }

            // Get total orders
            const totalOrders = await Order.count({ where: orderFilter });

            // Get total revenue
            const totalRevenueResult = await Order.findOne({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('total_price')), 'total']
                ],
                where: orderFilter,
                raw: true
            });
            const totalRevenue = parseFloat(totalRevenueResult?.total || 0);

            // Get total products sold
            const totalProductsSoldResult = await OrderItem.findOne({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('quantity')), 'total']
                ],
                include: [{
                    model: Order,
                    where: orderFilter,
                    attributes: []
                }],
                raw: true
            });
            const totalProductsSold = parseInt(totalProductsSoldResult?.total || 0);

            // Get average order value
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            return res.status(200).json({
                totalOrders,
                totalRevenue,
                totalProductsSold,
                avgOrderValue
            });
        } catch (error) {
            console.error('Error in getOverview:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Thống kê theo Brand (Giày Nam, Giày Nữ, Giày Trẻ Em)
    async getSalesByBrand(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Build date filter
            const dateFilter = {};
            if (startDate) {
                dateFilter[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                dateFilter[Op.lte] = new Date(endDate + ' 23:59:59');
            }

            // Filter only completed orders
            const orderFilter = { delivery_status: 3 };
            if (startDate || endDate) {
                orderFilter.createdAt = dateFilter;
            }

            // Get all brands
            const brands = await Brand.findAll();

            // Calculate sales for each brand
            const brandStats = await Promise.all(brands.map(async (brand) => {
                // Get products in this brand
                const products = await Product.findAll({
                    where: { brandId: brand.id },
                    attributes: ['id']
                });
                const productIds = products.map(p => p.id);

                if (productIds.length === 0) {
                    return {
                        brandId: brand.id,
                        brandName: brand.name,
                        totalOrders: 0,
                        totalQuantity: 0,
                        totalRevenue: 0
                    };
                }

                // Get order items for products in this brand
                const orderItems = await OrderItem.findAll({
                    include: [{
                        model: ProductVariant,
                        where: { productId: productIds },
                        attributes: ['id']
                    }, {
                        model: Order,
                        where: orderFilter,
                        attributes: ['id', 'total_price']
                    }]
                });

                let totalQuantity = 0;
                let totalRevenue = 0;
                const orderIds = new Set();

                orderItems.forEach(item => {
                    if (item.Order) {
                        totalQuantity += item.quantity;
                        totalRevenue += parseFloat(item.Order.total_price);
                        orderIds.add(item.Order.id);
                    }
                });

                return {
                    brandId: brand.id,
                    brandName: brand.name,
                    totalOrders: orderIds.size,
                    totalQuantity,
                    totalRevenue
                };
            }));

            return res.status(200).json(brandStats);
        } catch (error) {
            console.error('Error in getSalesByBrand:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Thống kê chi tiết theo sản phẩm đã bán
    async getSoldProducts(req, res) {
        try {
            const { startDate, endDate, brandId } = req.query;

            // Build date filter
            const dateFilter = {};
            if (startDate) {
                dateFilter[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                dateFilter[Op.lte] = new Date(endDate + ' 23:59:59');
            }

            // Filter only completed orders
            const orderFilter = { delivery_status: 3 };
            if (startDate || endDate) {
                orderFilter.createdAt = dateFilter;
            }

            // Product filter
            const productFilter = brandId ? { brandId: parseInt(brandId) } : {};

            // Get all products with their brand
            const products = await Product.findAll({
                where: productFilter,
                include: [{ model: Brand, attributes: ['id', 'name'] }]
            });

            const productStats = await Promise.all(products.map(async (product) => {
                // Get order items for this product
                const orderItems = await OrderItem.findAll({
                    include: [{
                        model: ProductVariant,
                        where: { productId: product.id },
                        attributes: ['id', 'color', 'size', 'price']
                    }, {
                        model: Order,
                        where: orderFilter,
                        attributes: ['id', 'total_price', 'createdAt']
                    }]
                });

                let totalQuantity = 0;
                let totalRevenue = 0;

                orderItems.forEach(item => {
                    if (item.Order) {
                        totalQuantity += item.quantity;
                        totalRevenue += parseFloat(item.Order.total_price);
                    }
                });

                return {
                    productId: product.id,
                    productName: product.name,
                    brandName: product.Brand?.name || 'Không xác định',
                    brandId: product.brandId,
                    totalQuantitySold: totalQuantity,
                    totalRevenue
                };
            }));

            // Filter only products that have been sold and sort by revenue
            const soldProducts = productStats
                .filter(p => p.totalQuantitySold > 0)
                .sort((a, b) => b.totalRevenue - a.totalRevenue);

            return res.status(200).json(soldProducts);
        } catch (error) {
            console.error('Error in getSoldProducts:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Thống kê theo ngày
    async getSalesByDate(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Default: last 30 days
            const end = endDate ? new Date(endDate + ' 23:59:59') : new Date();
            const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Filter only completed orders
            const orderFilter = {
                delivery_status: 3,
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            };

            // Get orders grouped by date
            const orders = await Order.findAll({
                where: orderFilter,
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('Order.createdAt')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
                    [sequelize.fn('SUM', sequelize.col('Order.total_price')), 'revenue']
                ],
                group: [sequelize.fn('DATE', sequelize.col('Order.createdAt'))],
                order: [[sequelize.fn('DATE', sequelize.col('Order.createdAt')), 'ASC']],
                raw: true
            });

            return res.status(200).json(orders);
        } catch (error) {
            console.error('Error in getSalesByDate:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Thống kê chi tiết theo Brand với sản phẩm
    async getBrandDetail(req, res) {
        try {
            const { brandId, startDate, endDate } = req.query;

            if (!brandId) {
                return res.status(400).json({ message: 'Thiếu brandId' });
            }

            // Build date filter
            const dateFilter = {};
            if (startDate) {
                dateFilter[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                dateFilter[Op.lte] = new Date(endDate + ' 23:59:59');
            }

            // Filter only completed orders
            const orderFilter = { delivery_status: 3 };
            if (startDate || endDate) {
                orderFilter.createdAt = dateFilter;
            }

            // Get brand info
            const brand = await Brand.findByPk(brandId);
            if (!brand) {
                return res.status(404).json({ message: 'Brand không tồn tại' });
            }

            // Get products in this brand
            const products = await Product.findAll({
                where: { brandId: parseInt(brandId) }
            });
            const productIds = products.map(p => p.id);

            if (productIds.length === 0) {
                return res.status(200).json({
                    brand,
                    totalRevenue: 0,
                    totalQuantity: 0,
                    products: []
                });
            }

            // Get all order items for products in this brand
            const orderItems = await OrderItem.findAll({
                include: [{
                    model: ProductVariant,
                    where: { productId: productIds },
                    attributes: ['id', 'productId', 'color', 'size', 'price'],
                    include: [{
                        model: Product,
                        attributes: ['id', 'name']
                    }]
                }, {
                    model: Order,
                    where: orderFilter,
                    attributes: ['id', 'total_price', 'createdAt']
                }]
            });

            // Calculate totals
            let totalQuantity = 0;
            let totalRevenue = 0;

            // Group by product
            const productStats = {};
            orderItems.forEach(item => {
                if (item.Order && item.ProductVariant && item.ProductVariant.Product) {
                    const productId = item.ProductVariant.productId;
                    const productName = item.ProductVariant.Product.name;

                    if (!productStats[productId]) {
                        productStats[productId] = {
                            productId,
                            productName,
                            totalQuantity: 0,
                            totalRevenue: 0,
                            variants: {}
                        };
                    }

                    productStats[productId].totalQuantity += item.quantity;
                    productStats[productId].totalRevenue += parseFloat(item.Order.total_price);

                    // Group by variant
                    const variantKey = `${item.ProductVariant.color}-${item.ProductVariant.size}`;
                    if (!productStats[productId].variants[variantKey]) {
                        productStats[productId].variants[variantKey] = {
                            color: item.ProductVariant.color,
                            size: item.ProductVariant.size,
                            price: parseFloat(item.ProductVariant.price),
                            quantitySold: 0
                        };
                    }
                    productStats[productId].variants[variantKey].quantitySold += item.quantity;

                    totalQuantity += item.quantity;
                    totalRevenue += parseFloat(item.Order.total_price);
                }
            });

            // Convert variants object to array
            const productsWithStats = Object.values(productStats).map(p => ({
                ...p,
                variants: Object.values(p.variants)
            })).sort((a, b) => b.totalRevenue - a.totalRevenue);

            return res.status(200).json({
                brand,
                totalRevenue,
                totalQuantity,
                products: productsWithStats
            });
        } catch (error) {
            console.error('Error in getBrandDetail:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerStatistics();

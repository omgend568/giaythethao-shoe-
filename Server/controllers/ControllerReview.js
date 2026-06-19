const Review = require('../models/ModelReview');
const ReviewImage = require('../models/ModelReviewImage');
const Product = require('../models/ModelProducts');
const ProductVariant = require('../models/ModelProductVariant');
const User = require('../models/ModelUser');
const Order = require('../models/ModelOrder');
const OrderItem = require('../models/ModelOrderItem');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

class ControllerReview {
    // Get order item ID for review (user can only review purchased products)
    async GetOrderItemId(req, res) {
        try {
            const { userId, productId } = req.query;

            if (!userId || !productId) {
                return res.status(400).json({ message: 'userId và productId là bắt buộc' });
            }

            // convert productId to variant ids
            const variants = await ProductVariant.findAll({ where: { productId }, attributes: ['id'] });
            const variantIds = variants.map(v => v.id);

            const orderItem = await OrderItem.findOne({
                include: [
                    {
                        model: Order,
                        where: { userId },
                        attributes: ['status'],
                    },
                ],
                where: {
                    productVariantId: variantIds,
                },
                raw: true,
            });

            if (!orderItem) {
                return res
                    .status(404)
                    .json({ message: 'Sản phẩm chưa được mua hoặc đơn hàng chưa hoàn thành' });
            }

            // Check if order status is completed (status = 1)
            if (orderItem['Order.status'] !== 1) {
                return res.status(400).json({ message: 'Đơn hàng chưa hoàn thành' });
            }

            // Check if review already exists
            const existingReview = await Review.findOne({ where: { orderItemId: orderItem.id } });
            if (existingReview) {
                return res.status(400).json({ message: 'Sản phẩm này đã được review' });
            }

            return res.status(200).json({ orderItemId: orderItem.id });
        } catch (error) {
            console.error('Lỗi getOrderItemId:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Create a new review
    CreateReview = async (req, res) => {
        try {
            const { userId, productId, orderItemId, rating, comment } = req.body;
            const reviewImages = req.files ? req.files.map((file) => file.filename) : [];

            if (!userId || !productId || !orderItemId) {
                return res.status(400).json({ message: 'Các trường bắt buộc không được để trống' });
            }

            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
            }

            // Check if review already exists for this orderItem
            const existingReview = await Review.findOne({ where: { orderItemId } });
            if (existingReview) {
                return res.status(400).json({ message: 'Sản phẩm này đã được review' });
            }

            // Create review
            const review = await Review.create({
                userId,
                productId,
                orderItemId,
                rating: rating || 5,
                comment: comment || null,
            });

            // Create review images if any
            if (reviewImages && reviewImages.length > 0) {
                await Promise.all(
                    reviewImages.map((url) => ReviewImage.create({ reviewId: review.id, url }))
                );
            }

            // Update product rating
            await this.UpdateProductRating(productId);

            return res.status(201).json({ message: 'Tạo review thành công', review });
        } catch (error) {
            console.error('Lỗi createReview:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get reviews for a product
    async GetProductReviews(req, res) {
        try {
            const { productId } = req.query;
            const { page = 1, limit = 10 } = req.query;

            if (!productId) {
                return res.status(400).json({ message: 'productId là bắt buộc' });
            }

            const offset = (page - 1) * limit;

            const { count, rows } = await Review.findAndCountAll({
                where: { productId },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'fullname'],
                    },
                    {
                        model: ReviewImage,
                        attributes: ['id', 'url'],
                    },
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            return res.status(200).json({
                reviews: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('Lỗi getProductReviews:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get review by ID
    async GetReviewById(req, res) {
        try {
            const { reviewId } = req.query;

            if (!reviewId) {
                return res.status(400).json({ message: 'reviewId là bắt buộc' });
            }

            const review = await Review.findOne({
                where: { id: reviewId },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'fullname'],
                    },
                    {
                        model: ReviewImage,
                        attributes: ['id', 'url'],
                    },
                ],
            });

            if (!review) {
                return res.status(404).json({ message: 'Review không tồn tại' });
            }

            return res.status(200).json(review);
        } catch (error) {
            console.error('Lỗi getReviewById:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Get reviews by user
    async GetUserReviews(req, res) {
        try {
            const { userId } = req.query;
            const { page = 1, limit = 10 } = req.query;

            if (!userId) {
                return res.status(400).json({ message: 'userId là bắt buộc' });
            }

            const offset = (page - 1) * limit;

            const { count, rows } = await Review.findAndCountAll({
                where: { userId },
                include: [
                    {
                        model: Product,
                        attributes: ['id', 'name', 'price'],
                    },
                    {
                        model: ReviewImage,
                        attributes: ['id', 'url'],
                    },
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            return res.status(200).json({
                reviews: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('Lỗi getUserReviews:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Update review
    UpdateReview = async (req, res) => {
        try {
            const { reviewId, userId } = req.body;
            const { rating, comment } = req.body;

            if (!reviewId || !userId) {
                return res.status(400).json({ message: 'reviewId và userId là bắt buộc' });
            }

            const review = await Review.findOne({ where: { id: reviewId } });
            if (!review) {
                return res.status(404).json({ message: 'Review không tồn tại' });
            }

            if (review.userId !== userId) {
                return res.status(403).json({ message: 'Không có quyền cập nhật review này' });
            }

            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
            }

            const oldRating = review.rating;
            await review.update({
                rating: rating || review.rating,
                comment: comment !== undefined ? comment : review.comment,
            });

            // Update product rating if rating changed
            if (oldRating !== rating) {
                await this.UpdateProductRating(review.productId);
            }

            return res.status(200).json({ message: 'Cập nhật review thành công', review });
        } catch (error) {
            console.error('Lỗi updateReview:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Delete review
    DeleteReview = async (req, res) => {
    try {
        const reviewId = req.query.id || req.body.reviewId;

        if (!reviewId) {
            return res.status(400).json({ message: 'reviewId là bắt buộc' });
        }

        const review = await Review.findOne({ where: { id: reviewId } });

        if (!review) {
            return res.status(404).json({ message: 'Review không tồn tại' });
        }

        const productId = review.productId;

        await review.destroy();

        // Update product rating after deletion
        await this.UpdateProductRating(productId);

        return res.status(200).json({ message: 'Admin đã xóa review thành công' });

    } catch (error) {
        console.error('Lỗi deleteReview:', error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
}


    // Update product rating average and count
    UpdateProductRating = async (productId) => {
        try {
            const result = await Review.findAll({
                attributes: [
                    [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count_reviews'],
                ],
                where: { productId },
                raw: true,
            });

            const avgRating = result[0].avg_rating ? parseFloat(result[0].avg_rating).toFixed(1) : 0;
            const countRatings = result[0].count_reviews || 0;

            await Product.update(
                {
                    rating_avg: avgRating,
                    rating_count: countRatings,
                },
                { where: { id: productId } }
            );
        } catch (error) {
            console.error('Lỗi updateProductRating:', error);
        }
    }

    // Get reviews statistics
    async GetReviewStats(req, res) {
        try {
            const { productId } = req.query;

            if (!productId) {
                return res.status(400).json({ message: 'productId là bắt buộc' });
            }

            const stats = await Review.findAll({
                attributes: [
                    'rating',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                ],
                where: { productId },
                group: ['rating'],
                raw: true,
            });

            const totalReviews = await Review.count({ where: { productId } });
            const avgRating = await Review.findOne({
                attributes: [['AVG', 'rating']],
                where: { productId },
                raw: true,
            });

            const distribution = {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0,
            };

            stats.forEach((stat) => {
                distribution[stat.rating] = stat.count;
            });

            return res.status(200).json({
                totalReviews,
                avgRating: avgRating.rating ? parseFloat(avgRating.rating).toFixed(1) : 0,
                distribution,
            });
        } catch (error) {
            console.error('Lỗi getReviewStats:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }


    async GetAllReviews(req, res) {
        try {
            const reviews = await Review.findAll({
                include: [
                    {
                        model: User,
                        attributes: [[ 'fullname', 'username' ]],
                    },
                    {
                        model: Product,
                        attributes: [[ 'name', 'productName' ]],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            // Normalize included model keys so client can access `user` and `product`
            const formatted = reviews.map((r) => {
                const plain = r.toJSON ? r.toJSON() : r;
                const user = plain.User || plain.user || null;
                const product = plain.Product || plain.product || null;
                return {
                    ...plain,
                    user,
                    product,
                };
            });

            return res.status(200).json(formatted);
        } catch (error) {
            console.error('Lỗi getAllReviews:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerReview();

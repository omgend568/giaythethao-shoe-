const Product = require('../models/ModelProducts');
const ProductVariant = require('../models/ModelProductVariant');
const ProductImage = require('../models/ModelProductImage');
const Brand = require('../models/ModelBrand');
const Category = require('../models/ModelCategory');
const ProductCategory = require('../models/ModelProductCategory');
const Order = require('../models/ModelOrder');
const OrderItem = require('../models/ModelOrderItem');
const Payment = require('../models/ModelPayment');
const slugify = require('slugify');
const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

class ControllerProduct {
    async AddProducts(req, res) {
        try {
            let { nameProduct, description, brandId, categoryId, variants, is_new } = req.body;

            if (variants && typeof variants === 'string') {
                try {
                    variants = JSON.parse(variants);
                } catch (err) {
                    console.warn('Failed to parse variants JSON:', err);
                    variants = [];
                }
            }

            const imgUrls = (req.files || []).map((file) => file.filename);
            const slug = slugify(nameProduct, '-', {
                replacement: '-',
                remove: undefined,
                lower: false,
                strict: false,
                locale: 'vi',
                trim: true,
            });

            const product = await Product.create({
                name: nameProduct,
                description,
                slug,
                brandId,
                is_new: is_new === true || is_new === 'true' || is_new === '1',
            });

            if (imgUrls.length > 0) {
                await Promise.all(
                    imgUrls.map((url) => ProductImage.create({ productId: product.id, url }))
                );
            }

            if (categoryId) {
                await ProductCategory.create({
                    productId: product.id,
                    categoryId: Number(categoryId),
                });
            }

            if (variants && Array.isArray(variants)) {
                const variantData = [];

                for (const variant of variants) {
                    if (Array.isArray(variant.sizes)) {
                        for (const size of variant.sizes) {
                            variantData.push({
                                productId: product.id,
                                color: variant.color,
                                size,
                                price: variant.price,
                                stock: variant.stock || 0,
                                sku: `${slug}-${variant.color}-${size}`,
                            });
                        }
                    } else {
                        variantData.push({
                            productId: product.id,
                            color: variant.color,
                            size: variant.size,
                            price: variant.price,
                            stock: variant.stock || 0,
                            sku: variant.sku || `${slug}-${variant.color}-${variant.size}`,
                        });
                    }
                }

                if (variantData.length > 0) {
                    await ProductVariant.bulkCreate(variantData);
                }
            }

            return res.status(200).json({ message: 'Thêm sản phẩm thành công' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async GetProducts(req, res) {
        try {
            const dataProduct = await Product.findAll({
                include: [
                    { model: ProductImage, attributes: ['id', 'url'] },
                    { model: Brand, attributes: ['id', 'name'] },
                    { model: ProductVariant },
                ],
            });
            return res.status(200).json(dataProduct);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async GetOneProducts(req, res) {
        try {
            const { id } = req.query;
            const dataProduct = await Product.findOne({
                where: { id },
                include: [
                    { model: ProductImage, attributes: ['id', 'url'] },
                    { model: Brand, attributes: ['id', 'name'] },
                    { model: ProductVariant },
                ],
            });

            if (!dataProduct) {
                return res.status(200).json([]);
            }

            return res.status(200).json([dataProduct]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async SearchProduct(req, res) {
        try {
            const { nameProduct } = req.query;

            if (!nameProduct || nameProduct.trim() === '' || nameProduct === 'undefined') {
                return res.status(200).json([]);
            }

            const dataProducts = await Product.findAll({
                where: {
                    name: {
                        [Op.like]: `%${nameProduct}%`,
                    },
                },
                include: [
                    { model: ProductImage, attributes: ['id', 'url'] },
                    { model: ProductVariant, attributes: ['id', 'price'] },
                ],
            });

            return res.status(200).json(dataProducts);
        } catch (error) {
            console.error('Lỗi tìm kiếm sản phẩm:', error);
            return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
        }
    }

    async EditPro(req, res) {
        try {
            let { id, nameProduct, description, brandId, variants, is_new, imagesToKeep, deletedImageIds } = req.body;

            if (variants && typeof variants === 'string') {
                try {
                    variants = JSON.parse(variants);
                } catch (err) {
                    console.warn('Failed to parse variants JSON:', err);
                    variants = [];
                }
            }

            if (!id) {
                return res.status(400).json({ message: 'Thiếu id sản phẩm' });
            }

            const data = await Product.findOne({ where: { id } });
            if (!data) {
                return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
            }

            await data.update({
                name: nameProduct,
                description,
                brandId: brandId || data.brandId,
                is_new: is_new === true || is_new === 'true' || is_new === '1',
            });

            // Parse imagesToKeep and deletedImageIds if they're strings
            let keepImageIds = [];
            if (imagesToKeep) {
                try {
                    keepImageIds = typeof imagesToKeep === 'string' ? JSON.parse(imagesToKeep) : imagesToKeep;
                } catch (err) {
                    console.warn('Failed to parse imagesToKeep:', err);
                    keepImageIds = [];
                }
            }

            let deletedIds = [];
            if (deletedImageIds) {
                try {
                    deletedIds = typeof deletedImageIds === 'string' ? JSON.parse(deletedImageIds) : deletedImageIds;
                } catch (err) {
                    console.warn('Failed to parse deletedImageIds:', err);
                    deletedIds = [];
                }
            }

            // Get all existing images for this product
            const existingImages = await ProductImage.findAll({ where: { productId: data.id } });

            // Delete images that are in the deleted list or not in the keep list (if keep list is provided)
            let imagesToDelete;
            if (keepImageIds.length > 0) {
                // User provided keep list - delete images not in keep list
                imagesToDelete = existingImages.filter((img) => !keepImageIds.includes(img.id));
            } else if (deletedIds.length > 0) {
                // User only provided deleted list - delete those specific images
                imagesToDelete = existingImages.filter((img) => deletedIds.includes(img.id));
            } else if (req.files && req.files.length > 0) {
                // New files uploaded without keep list - delete all old and add new
                imagesToDelete = existingImages;
            } else {
                imagesToDelete = [];
            }

            if (imagesToDelete.length > 0) {
                const filePaths = imagesToDelete.map((i) => path.join(__dirname, '../uploads', i.url));
                await Promise.all(imagesToDelete.map((img) => img.destroy()));
                await Promise.all(filePaths.map((file) => fs.unlink(file).catch(() => {})));
            }

            // Add new images if any
            if (req.files && req.files.length > 0) {
                const imgUrls = req.files.map((file) => file.filename);
                await Promise.all(
                    imgUrls.map((url) => ProductImage.create({ productId: data.id, url }))
                );
            }

            if (variants && Array.isArray(variants)) {
                await ProductVariant.destroy({ where: { productId: data.id } });

                const variantData = [];

                for (const variant of variants) {
                    if (Array.isArray(variant.sizes)) {
                        for (const size of variant.sizes) {
                            variantData.push({
                                productId: data.id,
                                color: variant.color,
                                size,
                                price: variant.price,
                                stock: variant.stock || 0,
                                sku: `${data.slug}-${variant.color}-${size}`,
                            });
                        }
                    } else {
                        variantData.push({
                            productId: data.id,
                            color: variant.color,
                            size: variant.size,
                            price: variant.price,
                            stock: variant.stock || 0,
                            sku: variant.sku || `${data.slug}-${variant.color}-${variant.size}`,
                        });
                    }
                }

                if (variantData.length > 0) {
                    await ProductVariant.bulkCreate(variantData);
                }
            }

            return res.status(200).json({ message: 'Cập Nhật Thành Công !!!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async deletePro(req, res) {
        try {
            const { id } = req.query;
            const dataPro = await Product.findOne({ where: { id } });

            if (!dataPro) {
                return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
            }

            const variantIds = (
                await ProductVariant.findAll({
                    where: { productId: dataPro.id },
                    attributes: ['id'],
                })
            ).map((v) => v.id);

            if (variantIds.length > 0) {
                const orderItem = await OrderItem.findOne({
                    where: { productVariantId: { [Op.in]: variantIds } },
                });
                if (orderItem) {
                    return res
                        .status(400)
                        .json({ message: 'Sản phẩm đã có khách đặt hàng, không thể xóa!' });
                }
            }

            const images = await ProductImage.findAll({ where: { productId: dataPro.id } });
            const filePaths = images.map((i) => path.join(__dirname, '../uploads', i.url));

            await dataPro.destroy();
            await Promise.all(filePaths.map((file) => fs.unlink(file).catch(() => {})));

            return res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server!', error });
        }
    }

    async EditOrder(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id, valueOption } = req.body;
            const newDeliveryStatus = Number(valueOption);

            const dataOrder = await Order.findOne({
                where: { id },
                include: [{ model: Payment }],
                transaction,
            });

            if (!dataOrder) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
            }

            const oldDeliveryStatus = dataOrder.delivery_status;

            // Kiểm tra chỉ được tiến (0→1→2→3), không được lùi
            if (newDeliveryStatus <= oldDeliveryStatus) {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: 'Không thể chuyển về trạng thái trước đó' 
                });
            }

            // Kiểm tra không được nhảy cóc (chỉ được chuyển 1 bước)
            if (newDeliveryStatus > oldDeliveryStatus + 1) {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: 'Phải cập nhật theo thứ tự từng bước' 
                });
            }

            // Khi chuyển sang "Chuẩn bị hàng" (delivery_status = 1): TRỪ STOCK NGAY
            // Để tránh overselling - người khác mua khi hàng đã được chốt cho đơn này
            if (newDeliveryStatus === 1 && oldDeliveryStatus === 0) {
                const orderItems = await OrderItem.findAll({
                    where: { orderId: id },
                    transaction,
                });

                for (const item of orderItems) {
                    const variant = await ProductVariant.findByPk(item.productVariantId, {
                        transaction,
                        lock: transaction.LOCK.UPDATE,
                    });

                    if (!variant) {
                        await transaction.rollback();
                        return res.status(404).json({ message: 'Biến thể sản phẩm không tồn tại' });
                    }

                    const currentStock = parseInt(variant.stock, 10) || 0;
                    const qty = parseInt(item.quantity, 10) || 0;

                    if (qty > currentStock) {
                        await transaction.rollback();
                        return res.status(400).json({
                            message: `Không đủ tồn kho cho size ${variant.size} (còn ${currentStock}, cần ${qty})`,
                        });
                    }

                    await variant.update({ stock: currentStock - qty }, { transaction });
                }
            }

            // Khi chuyển sang "Đã giao" (delivery_status = 3): cập nhật thanh toán COD
            if (newDeliveryStatus === 3 && oldDeliveryStatus !== 3) {
                if (dataOrder.Payment && dataOrder.Payment.method === 'cod') {
                    await dataOrder.Payment.update(
                        { status: 1, paidAt: new Date() },
                        { transaction }
                    );
                }
            }

            await dataOrder.update({ delivery_status: newDeliveryStatus }, { transaction });
            await transaction.commit();
            return res.status(200).json({ message: 'Cập Nhật Thành Công !!!' });
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async GetProductsByCategory(req, res) {
        try {
            const { categoryId, nameCategory } = req.query;

            if (!categoryId && (!nameCategory || nameCategory.trim() === '')) {
                return res.status(400).json({ message: 'Thiếu categoryId hoặc nameCategory' });
            }

            const categoryWhere = {};
            if (categoryId) {
                categoryWhere.id = Number(categoryId);
            } else {
                categoryWhere.name = {
                    [Op.like]: `%${nameCategory.trim()}%`,
                };
            }

            const dataProducts = await Product.findAll({
                include: [
                    { model: ProductImage, attributes: ['id', 'url'] },
                    { model: Brand, attributes: ['id', 'name'] },
                    { model: ProductVariant },
                    {
                        model: Category,
                        where: categoryWhere,
                        through: { attributes: [] },
                        attributes: ['id', 'name', 'slug', 'brandId'],
                    },
                ],
            });

            return res.status(200).json(dataProducts);
        } catch (error) {
            console.error('Lỗi tìm theo danh mục:', error);
            return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
        }
    }

    async SimilarProduct(req, res) {
        try {
            const { nameProduct } = req.query;
            const dataProducts = await Product.findAll({
                where: {
                    slug: {
                        [Op.like]: `%${nameProduct}%`,
                    },
                },
                include: [
                    { model: ProductImage, attributes: ['id', 'url'] },
                    { model: Brand, attributes: ['id', 'name'] },
                    { model: ProductVariant },
                ],
            });

            return res.status(200).json(dataProducts);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerProduct();

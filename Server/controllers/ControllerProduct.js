const Product = require('../models/ModelProducts');
const ProductVariant = require('../models/ModelProductVariant');
const ProductImage = require('../models/ModelProductImage');
const Brand = require('../models/ModelBrand');
const ProductCategory = require('../models/ModelProductCategory');
const OrderItem = require('../models/ModelOrderItem');
const slugify = require('slugify');
const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');

class ControllerProduct {
    async AddProducts(req, res) {
        try {
            let { nameProduct, description, brandId, categoryId, variants } = req.body;

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
            });

            return res.status(200).json(dataProducts);
        } catch (error) {
            console.error('Lỗi tìm kiếm sản phẩm:', error);
            return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
        }
    }

    async EditPro(req, res) {
        try {
            let { id, nameProduct, description, brandId, variants } = req.body;

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
            });

            if (req.files && req.files.length > 0) {
                const existingImages = await ProductImage.findAll({ where: { productId: data.id } });
                const filePaths = existingImages.map((i) =>
                    path.join(__dirname, '../uploads', i.url)
                );

                await Promise.all(existingImages.map((img) => img.destroy()));
                await Promise.all(filePaths.map((file) => fs.unlink(file).catch(() => {})));

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

    async SimilarProduct(req, res) {
        try {
            const { nameProduct } = req.query;
            const dataProducts = await Product.findAll({
                where: {
                    slug: {
                        [Op.like]: `%${nameProduct}%`,
                    },
                },
            });

            return res.status(200).json(dataProducts);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerProduct();

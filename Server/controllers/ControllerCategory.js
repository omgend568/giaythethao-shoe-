const Brand = require('../models/ModelBrand');
const Category = require('../models/ModelCategory');
const ProductCategory = require('../models/ModelProductCategory');
const slugify = require('slugify');

async function seedBrandsData() {
    const brands = [
        { id: 1, name: 'Giày Nam' },
        { id: 2, name: 'Giày Nữ' },
        { id: 3, name: 'Giày Trẻ Em' },
    ];

    for (const brand of brands) {
        await Brand.findOrCreate({ where: { id: brand.id }, defaults: { name: brand.name } });
    }
}

class ControllerCategory {
    async seedBrands(req, res) {
        try {
            await seedBrandsData();
            return res.status(200).json({ message: 'Seeded brands successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
    async getBrands(req, res) {
        try {
            const brands = await Brand.findAll();
            return res.status(200).json(brands);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getCategories(req, res) {
        try {
            const { brandId } = req.query;
            const where = brandId ? { brandId } : {};
            const categories = await Category.findAll({ where });
            return res.status(200).json(categories);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getAllCategoriesWithBrand(req, res) {
        try {
            const categories = await Category.findAll({
                include: [{ model: Brand, attributes: ['id', 'name'] }],
            });
            return res.status(200).json(categories);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async addCategory(req, res) {
        try {
            const { brandId, name } = req.body;
            if (!brandId || !name) {
                return res.status(400).json({ message: 'Thiếu brandId hoặc name' });
            }
            const brand = await Brand.findByPk(brandId);
            if (!brand) {
                return res.status(404).json({ message: 'Brand không tồn tại' });
            }
            const slug = slugify(name, '-', {
                replacement: '-',
                remove: undefined,
                lower: false,
                strict: false,
                locale: 'vi',
                trim: true,
            });
            const category = await Category.create({
                name,
                slug,
                brandId,
            });
            return res.status(200).json({ message: 'Thêm category thành công', category });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async editCategory(req, res) {
        try {
            const { id, name, brandId } = req.body;
            const category = await Category.findOne({ where: { id } });
            if (!category) {
                return res.status(404).json({ message: 'Danh mục không tồn tại' });
            }
            const slug = slugify(name, '-', {
                replacement: '-',
                remove: undefined,
                lower: false,
                strict: false,
                locale: 'vi',
                trim: true,
            });
            await category.update({
                name,
                slug,
                brandId,
            });
            return res.status(200).json({ message: 'Cập nhật danh mục thành công!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async deleteCategory(req, res) {
        try {
            const { id } = req.query;
            const category = await Category.findOne({ where: { id } });
            if (!category) {
                return res.status(404).json({ message: 'Danh mục không tồn tại!' });
            }

            const productCategory = await ProductCategory.findOne({ where: { categoryId: id } });
            if (productCategory) {
                return res.status(400).json({ message: 'Danh mục đã có sản phẩm, không thể xóa!' });
            }

            await category.destroy();
            return res.status(200).json({ message: 'Xóa danh mục thành công!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerCategory();
module.exports.seedBrandsData = seedBrandsData;

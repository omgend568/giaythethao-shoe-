const Cart = require('../models/ModelCart');
const CartItem = require('../models/ModelCartItem');
const ProductVariant = require('../models/ModelProductVariant');
const Product = require('../models/ModelProducts');
const ProductImage = require('../models/ModelProductImage');
const User = require('../models/ModelUser');
const { jwtDecode } = require('jwt-decode');
const { Op } = require('sequelize');

const cartInclude = [
    {
        model: CartItem,
        include: [
            {
                model: ProductVariant,
                include: [
                    {
                        model: Product,
                        include: [{ model: ProductImage }, { model: ProductVariant }],
                    },
                ],
            },
        ],
    },
];

const getVariantStock = (variant) => {
    const stock = parseInt(variant?.stock, 10);
    return Number.isNaN(stock) ? 0 : stock;
};

const validateQuantityAgainstStock = (variant, requestedQty) => {
    const stock = getVariantStock(variant);
    if (requestedQty > stock) {
        return {
            ok: false,
            message: stock > 0 ? `Chỉ còn ${stock} sản phẩm trong kho` : 'Sản phẩm đã hết hàng',
            max: stock,
        };
    }
    return { ok: true, max: stock };
};

class ControllerCart {
    async AddToCart(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập lại!' });

            const decoded = jwtDecode(token);
            const { productVariantId, quantity = 1 } = req.body;
            if (!productVariantId) return res.status(400).json({ message: 'Thiếu productVariantId' });

            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) return res.status(404).json({ message: 'Người dùng không tồn tại' });

            const variant = await ProductVariant.findOne({
                where: { id: productVariantId },
                include: [{ model: Product, include: [{ model: ProductImage }] }],
            });
            if (!variant) return res.status(404).json({ message: 'Variant không tồn tại' });

            const [cart] = await Cart.findOrCreate({ where: { userId: dataUser.id } });

            const existing = await CartItem.findOne({ where: { cartId: cart.id, productVariantId: variant.id } });
            const qtyToAdd = parseInt(quantity, 10);
            const newTotal = existing ? existing.quantity + qtyToAdd : qtyToAdd;

            const stockCheck = validateQuantityAgainstStock(variant, newTotal);
            if (!stockCheck.ok) {
                return res.status(400).json({ message: stockCheck.message });
            }

            if (existing) {
                existing.quantity = newTotal;
                existing.price = variant.price;
                await existing.save();
            } else {
                await CartItem.create({
                    cartId: cart.id,
                    productVariantId: variant.id,
                    quantity: qtyToAdd,
                    price: variant.price,
                });
            }

            const updated = await Cart.findOne({
                where: { id: cart.id },
                include: cartInclude,
            });

            return res.status(200).json({ message: 'Thêm vào giỏ hàng thành công', cart: updated });
        } catch (err) {
            return res.status(500).json({ message: 'Có lỗi xảy ra', error: err.message });
        }
    }

    async GetCart(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) return res.status(401).json({ message: 'Không có token' });
            const decoded = jwtDecode(token);
            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) return res.status(404).json({ message: 'Người dùng không tồn tại' });

            const cart = await Cart.findOne({
                where: { userId: dataUser.id },
                include: cartInclude,
            });
            return res.status(200).json(cart || { items: [] });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async DeleteCart(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) return res.status(401).json({ message: 'Không có token' });
            const decoded = jwtDecode(token);
            const { cartItemId } = req.body;
            if (!cartItemId) return res.status(400).json({ message: 'cartItemId required' });

            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) return res.status(404).json({ message: 'Người dùng không tồn tại' });

            const cart = await Cart.findOne({ where: { userId: dataUser.id } });
            if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

            const item = await CartItem.findOne({ where: { id: cartItemId, cartId: cart.id } });
            if (!item) return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });

            await item.destroy();
            return res.status(200).json({ message: 'Xóa sản phẩm thành công' });
        } catch (err) {
            return res.status(500).json({ message: 'Có lỗi xảy ra', error: err.message });
        }
    }

    async UpdateCartItem(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) return res.status(401).json({ message: 'Không có token' });

            const decoded = jwtDecode(token);
            const { cartItemId, quantity, productVariantId } = req.body;

            if (!cartItemId) {
                return res.status(400).json({ message: 'Thiếu cartItemId' });
            }

            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) return res.status(404).json({ message: 'Người dùng không tồn tại' });

            const cart = await Cart.findOne({ where: { userId: dataUser.id } });
            if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

            const item = await CartItem.findOne({ where: { id: cartItemId, cartId: cart.id } });
            if (!item) return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });

            if (productVariantId !== undefined && productVariantId !== null) {
                const newVariant = await ProductVariant.findByPk(productVariantId);
                if (!newVariant) return res.status(404).json({ message: 'Size không tồn tại' });

                const currentVariant = await ProductVariant.findByPk(item.productVariantId);
                if (!currentVariant || newVariant.productId !== currentVariant.productId) {
                    return res.status(400).json({ message: 'Size không hợp lệ' });
                }

                const qty =
                    quantity !== undefined ? parseInt(quantity, 10) : item.quantity;

                if (Number.isNaN(qty) || qty < 1) {
                    return res.status(400).json({ message: 'Số lượng phải >= 1' });
                }

                const stockCheck = validateQuantityAgainstStock(newVariant, qty);
                if (!stockCheck.ok) {
                    return res.status(400).json({ message: stockCheck.message });
                }

                if (newVariant.id === item.productVariantId) {
                    item.quantity = qty;
                    item.price = newVariant.price;
                    await item.save();
                } else {
                    const duplicate = await CartItem.findOne({
                        where: {
                            cartId: cart.id,
                            productVariantId: newVariant.id,
                            id: { [Op.ne]: item.id },
                        },
                    });

                    if (duplicate) {
                        const mergedQty = duplicate.quantity + qty;
                        const mergeStockCheck = validateQuantityAgainstStock(newVariant, mergedQty);
                        if (!mergeStockCheck.ok) {
                            return res.status(400).json({ message: mergeStockCheck.message });
                        }
                        duplicate.quantity = mergedQty;
                        duplicate.price = newVariant.price;
                        await duplicate.save();
                        await item.destroy();
                    } else {
                        item.productVariantId = newVariant.id;
                        item.quantity = qty;
                        item.price = newVariant.price;
                        await item.save();
                    }
                }
            } else if (quantity !== undefined) {
                const qty = parseInt(quantity, 10);
                if (Number.isNaN(qty) || qty < 1) {
                    return res.status(400).json({ message: 'Số lượng phải >= 1' });
                }

                const variant = await ProductVariant.findByPk(item.productVariantId);
                if (!variant) return res.status(404).json({ message: 'Variant không tồn tại' });

                const stockCheck = validateQuantityAgainstStock(variant, qty);
                if (!stockCheck.ok) {
                    return res.status(400).json({ message: stockCheck.message });
                }

                item.quantity = qty;
                await item.save();
            } else {
                return res.status(400).json({ message: 'Thiếu thông tin cập nhật' });
            }

            const updated = await Cart.findOne({
                where: { id: cart.id },
                include: cartInclude,
            });

            return res.status(200).json({ message: 'Cập nhật giỏ hàng thành công', cart: updated });
        } catch (err) {
            return res.status(500).json({ message: 'Có lỗi xảy ra', error: err.message });
        }
    }

    async updateInfoCart(req, res) {
        try {
            const { fullname, phone } = req.body;
            if (!fullname && !phone) return res.status(400).json({ message: 'Thiếu thông tin cập nhật' });

            const token = req.cookies.Token;
            if (!token) return res.status(401).json({ message: 'Không có token' });
            const decoded = jwtDecode(token);

            const dataUser = await User.findOne({ where: { email: decoded.email } });
            if (!dataUser) return res.status(404).json({ message: 'Người dùng không tồn tại' });

            await dataUser.update({ fullname: fullname || dataUser.fullname, phone: phone || dataUser.phone });
            return res.status(200).json({ message: 'Cập nhật thông tin người dùng thành công', user: dataUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
}

module.exports = new ControllerCart();

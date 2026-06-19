const Cart = require('../models/ModelCart');
const CartItem = require('../models/ModelCartItem');
const ProductVariant = require('../models/ModelProductVariant');
const Product = require('../models/ModelProducts');
const ProductImage = require('../models/ModelProductImage');
const User = require('../models/ModelUser');
const { jwtDecode } = require('jwt-decode');

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

            if (existing) {
                existing.quantity = existing.quantity + parseInt(quantity, 10);
                existing.price = variant.price;
                await existing.save();
            } else {
                await CartItem.create({ cartId: cart.id, productVariantId: variant.id, quantity, price: variant.price });
            }

            const updated = await Cart.findOne({
                where: { id: cart.id },
                include: [
                    {
                        model: CartItem,
                        include: [
                            {
                                model: ProductVariant,
                                include: [{ model: Product, include: [{ model: ProductImage }] }],
                            },
                        ],
                    },
                ],
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
                include: [
                    {
                        model: CartItem,
                        include: [
                            {
                                model: ProductVariant,
                                include: [{ model: Product, include: [{ model: ProductImage }] }],
                            },
                        ],
                    },
                ],
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

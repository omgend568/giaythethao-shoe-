const User = require('./ModelUser');
const Cart = require('./ModelCart');
const CartItem = require('./ModelCartItem');
const Payment = require('./ModelPayment');
const Product = require('./ModelProducts');
const Brand = require('./ModelBrand');
const ProductImage = require('./ModelProductImage');
const Category = require('./ModelCategory');
const ProductCategory = require('./ModelProductCategory');
const Order = require('./ModelOrder');
const OrderItem = require('./ModelOrderItem');
const ProductVariant = require('./ModelProductVariant');
const Review = require('./ModelReview');
const ReviewImage = require('./ModelReviewImage');
const Promotion = require('./ModelPromotion');
const PromotionProduct = require('./ModelPromotionProduct');
const PromotionUsage = require('./ModelPromotionUsage');

// User - Cart (1:1)
User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// Cart - CartItem (1:M)
Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// CartItem - ProductVariant
ProductVariant.hasMany(CartItem, { foreignKey: 'productVariantId' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

// Product - Brand
Brand.hasMany(Product, { foreignKey: 'brandId' });
Product.belongsTo(Brand, { foreignKey: 'brandId' });

// Brand - Category
Brand.hasMany(Category, { foreignKey: 'brandId', onDelete: 'CASCADE' });
Category.belongsTo(Brand, { foreignKey: 'brandId' });

// Product - ProductImage
Product.hasMany(ProductImage, { foreignKey: 'productId', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

// Product - Category (M:N)
Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'productId', otherKey: 'categoryId' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'categoryId', otherKey: 'productId' });

// Orders & OrderItems
User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Payment belongs to Order
Order.hasMany(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

// Reviews & ReviewImages
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

OrderItem.hasOne(Review, { foreignKey: 'orderItemId', onDelete: 'CASCADE' });
Review.belongsTo(OrderItem, { foreignKey: 'orderItemId' });

Review.hasMany(ReviewImage, { foreignKey: 'reviewId', onDelete: 'CASCADE' });
ReviewImage.belongsTo(Review, { foreignKey: 'reviewId' });

// Product - Variant
Product.hasMany(ProductVariant, { foreignKey: 'productId', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });

// CartItem - Variant
ProductVariant.hasMany(CartItem, { foreignKey: 'productVariantId' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

// OrderItem - Variant
ProductVariant.hasMany(OrderItem, { foreignKey: 'productVariantId' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

// Promotions
Promotion.belongsToMany(Product, {
    through: PromotionProduct,
    as: 'PromotionProducts',
    foreignKey: 'promotionId',
    otherKey: 'productId',
});
Product.belongsToMany(Promotion, {
    through: PromotionProduct,
    foreignKey: 'productId',
    otherKey: 'promotionId',
});

// Direct association for querying (no alias to avoid conflict)
Promotion.hasMany(PromotionProduct, { foreignKey: 'promotionId' });
PromotionProduct.belongsTo(Promotion, { foreignKey: 'promotionId' });
PromotionProduct.belongsTo(Product, { foreignKey: 'productId' });

Promotion.hasMany(Order, { foreignKey: 'promotionId', onDelete: 'SET NULL' });
Order.belongsTo(Promotion, { foreignKey: 'promotionId' });

Promotion.hasMany(PromotionUsage, { foreignKey: 'promotionId', onDelete: 'CASCADE' });
PromotionUsage.belongsTo(Promotion, { foreignKey: 'promotionId' });

User.hasMany(PromotionUsage, { foreignKey: 'userId', onDelete: 'CASCADE' });
PromotionUsage.belongsTo(User, { foreignKey: 'userId' });

Order.hasOne(PromotionUsage, { foreignKey: 'orderId', onDelete: 'CASCADE' });
PromotionUsage.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
	User,
	Cart,
	CartItem,
	Product,
	ProductVariant,
	Brand,
	ProductImage,
	Category,
	ProductCategory,
	Order,
	OrderItem,
	Payment,
	Review,
	ReviewImage,
	Promotion,
	PromotionProduct,
	PromotionUsage,
};

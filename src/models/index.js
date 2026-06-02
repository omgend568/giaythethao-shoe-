const User = require('./User');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Payment = require('./Payment');
const Product = require('./Product');
const Brand = require('./Brand');
const ProductImage = require('./ProductImage');
const Category = require('./Category');
const ProductCategory = require('./ProductCategory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const ProductVariant = require('./ProductVariant');
const Review = require('./Review');
const ReviewImage = require('./ReviewImage');

User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

ProductVariant.hasMany(CartItem, { foreignKey: 'productVariantId' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

Brand.hasMany(Product, { foreignKey: 'brandId' });
Product.belongsTo(Brand, { foreignKey: 'brandId' });

Brand.hasMany(Category, { foreignKey: 'brandId', onDelete: 'CASCADE' });
Category.belongsTo(Brand, { foreignKey: 'brandId' });

Product.hasMany(ProductImage, { foreignKey: 'productId', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'productId', otherKey: 'categoryId' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'categoryId', otherKey: 'productId' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

OrderItem.hasOne(Review, { foreignKey: 'orderItemId', onDelete: 'CASCADE' });
Review.belongsTo(OrderItem, { foreignKey: 'orderItemId' });

Review.hasMany(ReviewImage, { foreignKey: 'reviewId', onDelete: 'CASCADE' });
ReviewImage.belongsTo(Review, { foreignKey: 'reviewId' });

Product.hasMany(ProductVariant, { foreignKey: 'productId', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });

ProductVariant.hasMany(OrderItem, { foreignKey: 'productVariantId' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

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
};

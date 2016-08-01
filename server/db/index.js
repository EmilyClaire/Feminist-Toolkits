'use strict';
var db = require('./_db');
var User = require('./models/user');
var Order = require('./models/order');
var OrderProducts = require('./models/order-products');

var Review = require('./models/review');
var Product = require('./models/product');
var Category = require('./models/category');


//Since we required in the models, we can now make changes to them that will persist in memory - such as setting up relations!
Category.belongsToMany(Product, { through: 'categoryProducts' });
Product.belongsToMany(Category, { through: 'categoryProducts' });

Review.belongsTo(Product);
Product.hasMany(Review);

Review.belongsTo(User);
User.hasMany(Review);

Order.belongsTo(User);
User.hasMany(Order);


Product.belongsToMany(Order, {through: OrderProducts});
Order.belongsToMany(Product, {through: OrderProducts});

module.exports=db;


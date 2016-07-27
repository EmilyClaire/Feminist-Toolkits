'use strict';
var db = require('./_db');
var Sequelize = require('sequelize');


var User = require('./models/user');
var Order = require('./models/order');
var Review = require('./models/review');
var Product = require('./models/product');
var Category = require('./models/category');

// var CategoryProducts = db.define('CategoryProducts', {
//   role: Sequelize.STRING
// });

// var ProductCategories = db.define('product_categories', {
//   role: Sequelize.STRING
// });


// Product.belongsToMany(Category, {
//   through: CategoryProducts
// }); // Product.getCategories() -- n:m

// Review.belongsTo(Product) -- 1:1
// Review.belongsTo(User) -- 1:1
// Product.hasMany(Review) -- 1:m
// User.hasMany(Review) -- 1:m

// Order.hasMany(Product) -- 1:m
// Order.belongsTo(User) - takes userId and puts it on the orders table -- 1:1
// User.hasMany(Orders) - creates a relations table in database -- 1:m
module.exports = db;

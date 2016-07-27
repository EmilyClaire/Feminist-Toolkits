'use strict';

var expect = require('chai').expect;
var Product = require('../../../server/db/models/product');
// var User = require('../../../server/db/models/user');
// var Order = require('../../../server/db/models/order');
var Category = require('../../../server/db/models/category');
// var Review = equire('../../../server/db/models/review');
var db = require('../../../server/db/_db');



describe('Category', function () {

  before(function () {
    return db.sync({force: true});
  });

  it('belongs to many different products', function () {

    var productsArr;
    var product1 = Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
    var product2 = Product.create({ name: 'Baking kit', description: 'Most delicious pastel cupcakes', inventory: 100, currentPrice: 10.00});

    Promise.all([product1, product2])
    .then(function(products) {
        productsArr = products;
        return Category.create({
          name: 'Leisure'
        });
      })
      .then(function(category) {
        return category.setProducts(productsArr);
      })
      .then(function() {
        return Category.findOne({
          where: { name: 'Leisure' },
          include: { model: Product }
        });
      })
      .then(function(category) {
        var products = category.getProducts();
        expect(products).to.exist;
        expect(products).to.contain(product1);
        expect(products).to.contain(product2);
      });

  });

});

// Category.belongsToMany(Product) --> Category.getProducts() -- n:m
// Product.belongsToMany(Category) --> Product.getCategories() -- n:m

// Review.belongsTo(Product) -- 1:1
// Review.belongsTo(User) -- 1:1
// Product.hasMany(Review) -- 1:m
// User.hasMany(Review) -- 1:m

// Order.hasMany(Product) -- 1:m
// Order.belongsTo(User) - takes userId and puts it on the orders table -- 1:1
// User.hasMany(Orders) - creates a relations table in database -- 1:m

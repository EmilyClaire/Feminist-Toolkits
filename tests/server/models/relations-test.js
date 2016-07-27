'use strict';

var expect = require('chai').expect;
var Product = require('../../../server/db/models/product');
// var User = require('../../../server/db/models/user');
// var Order = require('../../../server/db/models/order');
var Category = require('../../../server/db/models/category');
// var Review = equire('../../../server/db/models/review');
var db = require('../../../server/db/_db');
var should = require('chai').should();



describe('Category', function () {

  before(function () {
    return db.sync({force: true});
  });


  it('belongs to many different products', function () {
    var test=function(){
      var productsArr;
      var product1 = Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
      var product2 = Product.create({ name: 'Baking kit', description: 'Most delicious pastel cupcakes', inventory: 100, currentPrice: 10.00});

      Promise.all([product1, product2])
      .then(function(products) {
          // console.log('products',products);
          productsArr = products;
          return Category.create({
            name: 'Leisure'
          });
        })
        .then(function(category) {
          console.log('category',category);
          console.log('thething',category.setProducts(productsArr))
          return category.setProducts(productsArr);
        })
        .then(function(response) {
          console.log('in then',response)
          return Category.findOne({
            where: { name: 'Leisure' },
            include: { model: Product }
          });
        })
        .then(function(category) {
          console.log('in then');
          var products = category.getProducts();
          console.log('products',products);
          expect(products).to.exist;
          expect(products).to.contain(product1);
          expect(products).to.contain(product2);
        })
        // .catch(function(err){
        //   false.should.equal(true)

        // })
    }
    expect(test()).to.not.throw(Error);
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

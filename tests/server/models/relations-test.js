'use strict';

var expect = require('chai').expect;
var Product = require('../../../server/db/models/product');
var User = require('../../../server/db/models/user');
var Order = require('../../../server/db/models/order');
var Category = require('../../../server/db/models/category');
var Review = require('../../../server/db/models/review');
var db = require('../../../server/db/_db');
var OrderProducts=require('../../../server/db/models/order-products');
var Promise=require('bluebird');
 
describe('Category',function(){
  beforeEach(function () {
    return db.sync({force: true});
  });
  it('can be associated with multiple products',function(){
    var productsArr;
    var category1=Category.create({
             name: 'Leisure'});
    var product1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
    var product2=Product.create({ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 10, currentPrice: 100.00});
 
    return Promise.all([category1,product1,product2])
    .spread(function(category,product1,product2){
      productsArr=[product1,product2]
      return category.addProducts(productsArr);
    })
    .then(function(){
      return Category.findOne({
            where: { name: 'Leisure' },
            include: { model: Product }
          })
    })
    .then(function(category){
      expect(category.products[0].name).to.equal('Unicorn robot');
      expect(category.products[1].name).to.equal('Unicorn puppy');
    })

  })
})

describe('Product',function(){
  beforeEach(function () {
    return db.sync({force: true});
  });
  it('can be associated with multiple categories',function(){
    var categoriesArr;
    var category1=Category.create({
             name: 'Leisure'});
    var category2=Category.create({
             name: 'Evil'});
    var product=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});

    return Promise.all([product,category1,category2])
    .spread(function(product,category1,category2){
      categoriesArr=[category1,category2]
      return product.addCategories(categoriesArr);
    })
    .then(function(){
      return Product.findOne({
            where: { name: 'Unicorn robot'},
            include: { model: Category}
          })
    })
    .then(function(product){
      expect(product.categories[0].name).to.equal('Leisure');
      expect(product.categories[1].name).to.equal('Evil');
    })
  })
  it('has many reviews',function(){
      var reviewsArr;
      var review1=Review.create({
               stars: 5,
                content: 'the best damn unicorn i ever rode'});
      var review2=Review.create({
               stars: 1,
                content: 'the worst evilest robot i ever saw'});
      var product=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});

      return Promise.all([product,review1,review2])
      .spread(function(product,review1,review2){
        reviewsArr=[review1,review2]
        return product.addReviews(reviewsArr);
      })
      .then(function(){
        return Product.findOne({
              where: { name: 'Unicorn robot'},
              include: { model: Review}
            })
      })
      .then(function(product){
        return product.getReviews();
      })
      .then(function(reviews){
        var reviewContents=[]
        reviews.forEach(function(review){
          reviewContents.push(review.dataValues.content)
        })
        expect(reviewContents).to.contain('the best damn unicorn i ever rode');
        expect(reviewContents).to.contain('the worst evilest robot i ever saw');

      })
    })
})

describe('Review',function(){
  beforeEach(function () {
    return db.sync({force: true});
  });
  it('belongs to a product',function(){
    var review1=Review.create({stars: 5,content: 'the best damn unicorn i ever rode'});
    var product1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
    return Promise.all([review1,product1])
    .spread(function(review,product){
      return review.setProduct(product);
    })
    .then(function(review){
      return Review.findById(review.dataValues.id,{include: {model: Product}})
    })
    .then(function(review){
      return review.getProduct();
    })
    .then(function(product){
      expect(product.dataValues.name).to.equal('Unicorn robot');
    })
  })
  it('belongs to a user',function(){
    var review1=Review.create({stars: 5,content: 'the best damn unicorn i ever rode'});
    var user1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});
    return Promise.all([review1,user1])
    .spread(function(review,user){
      return review.setUser(user);
    })
    .then(function(review){
      return Review.findById(review.dataValues.id,{include: {model: User}})
    })
    .then(function(review){
      return review.getUser();
    })
    .then(function(user){
      expect(user.dataValues.name).to.equal('bob');
    });
  })
})

describe('User',function(){
  beforeEach(function () {
    return db.sync({force: true});
  });
  it('has many reviews',function(){
      var reviewsArr;
      var review1=Review.create({
               stars: 5,
                content: 'the best damn unicorn i ever rode'});
      var review2=Review.create({
               stars: 1,
                content: 'the worst evilest robot i ever saw'});
      var user1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});

      return Promise.all([user1,review1,review2])
      .spread(function(user1,review1,review2){
        reviewsArr=[review1,review2]
        return user1.addReviews(reviewsArr);
      })
      .then(function(){
        return User.findOne({
              where: { name: 'bob'},
              include: { model: Review}
            })
      })
      .then(function(user){
        return user.getReviews();
      })
      .then(function(reviews){
        var reviewContents=[]
        reviews.forEach(function(review){
          reviewContents.push(review.dataValues.content)
        })
        expect(reviewContents).to.contain('the best damn unicorn i ever rode');
        expect(reviewContents).to.contain('the worst evilest robot i ever saw');
      })
    })
  it('has many orders',function(){
      var ordersArr;
      var order1=Order.create({shippingAddress: 'the cupboard'});
      var order2=Order.create({shippingAddress: 'faraway'});
      var user1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});

      return Promise.all([user1,order1,order2])
      .spread(function(user1,order1,order2){
        ordersArr=[order1,order2]
        return user1.addOrders(ordersArr);
      })
      .then(function(){
        return User.findOne({
              where: { name: 'bob'},
              include: { model: Order}
            })
      })
      .then(function(user){
        return user.getOrders();
      })
      .then(function(orders){
        var orderAdresses=[]
        orders.forEach(function(order){
          orderAdresses.push(order.dataValues.shippingAddress)
        })
        expect(orderAdresses).to.contain('the cupboard');
        expect(orderAdresses).to.contain('faraway');
      })
  })
})

describe('Order',function(){
  beforeEach(function () {
    return db.sync({force: true});
  });
  it('has many products',function(){
    var productsArr;
    var product1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
    var product2=Product.create({ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 10, currentPrice: 100.00});
    var order=Order.create({shippingAddress: 'the cupboard'});

    return Promise.all([order,product1,product2])
    .spread(function(order,product1,product2){
      productsArr=[product1,product2]
      return order.addProducts(productsArr);
    })
    .then(function(){
      return Order.findOne({
            where: { shippingAddress: 'the cupboard'},
            include: { model: Product}
          })
    })
    .then(function(order){
      return order.getProducts();
    })
    .then(function(products){
      var productNames=[]
      products.forEach(function(product){
        productNames.push(product.dataValues.name)
      })
      expect(productNames).to.contain('Unicorn robot');
      expect(productNames).to.contain('Unicorn puppy');

    })
  })
  it('belongs to a user',function(){
    var order1=Order.create({shippingAddress: 'the cupboard'});
    var user1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});
    return Promise.all([order1,user1])
    .spread(function(order,user){
      return order.setUser(user);
    })
    .then(function(order){
      return Order.findById(order.dataValues.id,{include: {model: User}})
    })
    .then(function(order){
      return order.getUser();
    })
    .then(function(user){
      expect(user.dataValues.name).to.equal('bob');
    });    
  })
  it('products in orderProducts have a priceAtPurchase which is set once and does not change',function(){
    var product1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
    var order=Order.create({shippingAddress: 'the cupboard'});
    return Promise.all([order,product1])
    .spread(function(order,product){
      product1=product;
      return order.addProduct(product, {priceAtPurchase: product.currentPrice});
    })
    .then(function(){
      product1.currentPrice=0;
      return product1.save();
    })
    .then(function(product){
      expect(product.currentPrice).to.equal(0);
    })
    .then(function(){
      return Order.findOne({
            where: { shippingAddress: 'the cupboard'},
            include: { model: Product}
          })
    })
    .then(function(order){
      return OrderProducts.findOne({where: {productId: product1.id}})
    })
    .then(function(product){
      expect(product.priceAtPurchase).to.equal(100.00);
    }) 
  })
})

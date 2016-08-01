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

xdescribe('Relations',function(){ 

  var categoriesArr;
  var productsArr;
  var reviewsArr;
  var ordersArr;
  var user;

  beforeEach(function () {
    return db.sync({force: true});
  });
  
  beforeEach(function (done) {
      var categoryProm1=Category.create({name: 'Leisure'});
      var categoryProm2=Category.create({name: 'Evil'});
      var productProm1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
      var productProm2=Product.create({ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 10, currentPrice: 100.00});
      var reviewProm1=Review.create({
                 stars: 5,
                  content: 'the best damn unicorn i ever rode'});
      var reviewProm2=Review.create({
                 stars: 1,
                  content: 'the worst evilest robot i ever saw'});
      var userProm1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});
      var orderProm1=Order.create({shippingAddress: 'the cupboard'});
      var orderProm2=Order.create({shippingAddress: 'faraway'});

      Promise.all([categoryProm1,categoryProm2,productProm1,productProm2,reviewProm1,reviewProm2,userProm1,orderProm1,orderProm2])
      .spread(function(category1,category2,product1,product2,review1,review2,user1,order1,order2){
        categoriesArr=[category1,category2];
        productsArr=[product1,product2];
        reviewsArr=[review1,review2];
        user=user1;
        ordersArr=[order1,order2]
        done();
      })
  });


  describe('Category',function(){
    it('belongs to many products',function(){
     return categoriesArr[0].addProducts(productsArr)
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
    it('belongs to many categories',function(){
      return productsArr[0].addCategories(categoriesArr)
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
        return productsArr[0].addReviews(reviewsArr)
        .then(function(product){
          return product.getReviews();
        })
        .then(function(reviews){
          var reviewContents=[]
          reviews.forEach(function(review){
            reviewContents.push(review.content)
          })
          expect(reviewContents).to.contain('the best damn unicorn i ever rode');
          expect(reviewContents).to.contain('the worst evilest robot i ever saw');

        })
      })
  })

  describe('Review',function(){
    it('belongs to a product',function(){
      return reviewsArr[0].setProduct(productsArr[0])
      .then(function(review){
        return Review.findById(review.id,{include: {model: Product}})
      })
      .then(function(review){
        return review.getProduct();
      })
      .then(function(product){
        expect(product.name).to.equal('Unicorn robot');
      })
    })
    it('belongs to a user',function(){
      return reviewsArr[0].setUser(user)
      .then(function(review){
        return review.getUser();
      })
      .then(function(theUser){
        expect(theUser.name).to.equal('bob');
      });
    })
  })

  describe('User',function(){
    it('has many reviews',function(){
        return user.addReviews(reviewsArr)
        .then(function(user){
          return user.getReviews();
        })
        .then(function(reviews){
          var reviewContents=[]
          reviews.forEach(function(review){
            reviewContents.push(review.content)
          })
          expect(reviewContents).to.contain('the best damn unicorn i ever rode');
          expect(reviewContents).to.contain('the worst evilest robot i ever saw');
        })
      })
    it('has many orders',function(){
        return user.addOrders(ordersArr)
        .then(function(theUser){
          return theUser.getOrders();
        })
        .then(function(orders){
          var orderAdresses=[]
          orders.forEach(function(order){
            orderAdresses.push(order.shippingAddress)
          })
          expect(orderAdresses).to.contain('the cupboard');
          expect(orderAdresses).to.contain('faraway');
        })
    })
  })

  describe('Order',function(){
    it('has many products',function(){
      return ordersArr[0].addProducts(productsArr)
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
          productNames.push(product.name)
        })
        expect(productNames).to.contain('Unicorn robot');
        expect(productNames).to.contain('Unicorn puppy');

      })
    })
    it('belongs to a user',function(){
      return ordersArr[0].setUser(user)
      .then(function(order){
        return Order.findById(order.id,{include: {model: User}})
      })
      .then(function(order){
        return order.getUser();
      })
      .then(function(user){
        expect(user.name).to.equal('bob');
      });    
    })

  })

  describe('OrderProduct',function(){
    it('has a priceAtPurchase column which is set once and does not change',function(){
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
  });
});
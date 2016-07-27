'use strict';

var expect = require('chai').expect;
var Product = require('../../../server/db/models/product');
var User = require('../../../server/db/models/user');
var Order = require('../../../server/db/models/order');
var Category = require('../../../server/db/models/category');
var Review = require('../../../server/db/models/review');
var db = require('../../../server/db/_db');


describe('Category',function(){
  beforeEach(function () {
    return db.sync({force: true});
  });
  it('can be associated with product',function(){
    console.log('hi');
    var category1=Category.create({
             name: 'Leisure'});
    var product1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
    Promise.all([category1,product1])
    .then(function(arr){
      console.log('category pre-association',arr[0]);
      console.log('product pre-association',arr[1])
      return arr[0].addProduct(arr[1]);
    })
    .then(function(category){
      return Category.findOne({
            where: { name: 'Leisure' },
            include: { model: Product }
          })

      // console.log('category post-association',category);
    })
    .then(function(category){
      console.log(category);
      console.log('products of category',category.products);
    })

  })
})

// describe('Category', function () {

//   beforeEach(function () {
//     return db.sync({force: true});
//   });


//   it('belongs to many different products', function (done) {
//     var test=function(){
//       var productsArr;
//       var product1 = Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
//       var product2 = Product.create({ name: 'Baking kit', description: 'Most delicious pastel cupcakes', inventory: 100, currentPrice: 10.00});

//       Promise.all([product1, product2])
//       .then(function (products) {
//           productsArr = products;
//           return Category.create({
//             name: 'Leisure'
//           });
//         })
//         .then(function (category) {
//           return category.setProducts(productsArr)
//         })
//         .then(function () {
//           return Category.findOne({
//             where: { name: 'Leisure' },
//             include: { model: Product }
//           });
//         })
//         .then(function (category) {
//           var products = category.getProducts();
//           expect(products).to.exist;
//           expect(products).to.contain(product1);
//           expect(products).to.contain(product2);
//         })
//         .catch(console.error.bind(console));
//     }
//     expect(test()).to.not.throw(Error);
//     done();
//   });

// });

// describe('Product', function () {

//   before(function () {
//     return db.sync({force: true});
//   });


//   it('belongs to many categories', function () {
//     var test=function(){
//       var categoryArr;
//       var category1 = Category.create({ name: 'Leisure'});
//       var category2 = Category.create({ name: 'Defense'});

//       Promise.all([category1, category2])
//       .then(function (categories) {
//           categoryArr = categories;
//           return Product.create({ name: 'Baking kit', description: 'Most delicious pastel cupcakes', inventory: 100, currentPrice: 10.00});
//         })
//         .then(function (product) {
//           return product.setCategories(categoryArr);
//         })
//         .then(function (response) {
//           return Product.findOne({
//             where: { name: 'Baking kit' },
//             include: { model: Category }
//           });
//         })
//         .then(function (product) {
//           var categories = product.getCategories();
//           expect(categories).to.exist;
//           expect(categories).to.contain(category1);
//           expect(categories).to.contain(category2);
//         })
//     }
//     expect(test()).to.not.throw(Error);
//   });

// });

// describe('Review', function () {

//   before(function () {
//     return db.sync({force: true});
//   });


//   it('belongs to a product', function () {
//     var test = function(){
//       var product = Product.create({ name: 'Baking kit', description: 'Most delicious pastel cupcakes', inventory: 100, currentPrice: 10.00});

//       product
//       .then(function (product) {
//         return Review.create({
//           stars: 5,
//           content: 'This is the most amazing cupcakes and they are so pretty and feminine'
//         })
//       })
//       .then(function (review) {
//           return review.setProduct(product);
//         })
//         .then(function (response) {
//           return Product.findOne({
//             where: { name: 'Baking kit' },
//             include: { model: Category }
//           });
//         })
//         .then(function (product) {
//           var categories = product.getCategories();
//           expect(categories).to.exist;
//           expect(categories).to.contain(category1);
//           expect(categories).to.contain(category2);
//         })
//     }
//     expect(test()).to.not.throw(Error);
//   });

// });

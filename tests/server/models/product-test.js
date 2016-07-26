'use strict';

var expect = require('chai').expect;
var Product = require('../../../server/db/models/product');
var db = require('../../../server/db/_db');

/**
 *
 * Start here!
 *
 * These tests describe the model that you'll be writing in models/article.js
 *
 */

describe('Products', function () {

  /**
   * First we clear the database and recreate the tables before beginning each run
   */
  before(function () {
    return db.sync({force: true});
  });

  var description = 'The South African cliff swallow (Petrochelidon spilodera), also known as the South African swallow, is a species of bird in the Hirundinidae family.';

  /**
   * Your model should have two fields (both required): `Name` and `Description`.
   *
   * http://docs.sequelizejs.com/en/latest/docs/models-definition/#validations
   */
  it('has name, description, and inventory', function () {
    return Product.create({
      name: 'Migratory Birds',
      description: description,
      inventory: 10
    }).then(function (savedProduct) {
      expect(savedProduct.name).to.equal('Migratory Birds');
      expect(savedProduct.description).to.equal(description);
      expect(savedProduct.inventory).to.equal(10);
    });

  });

  it('requires description', function () {

    var product = Product.build({
      name: 'My Second Product'
    });

    return product.validate()
      .then(function(result) {
        expect(result).to.be.an.instanceOf(Error);
        expect(result.message).to.contain('notNull');
      });
    

  });

  it('description cannot be empty', function () {

    var product = Product.build({
      name: 'Apple',
      description: ''
    });

    return product.validate()
      .then(function (result) {
        expect(result).to.be.an.instanceOf(Error);
        expect(result.message).to.contain('Validation error');
      });

  });

  it('name cannot be empty', function () {

    var product = Product.build({
      name: '',
      description: 'Some more wonderful text'
    });

    return product.validate()
      .then(function (result) {
        expect(result).to.be.an.instanceOf(Error);
        expect(result.message).to.contain('Validation error');
      });

  });

  it('requires name', function () {

    var product = Product.build({
      description: 'Some more wonderful text'
    });

    return product.validate()
      .then(function (result) {
        expect(result).to.be.an.instanceOf(Error);
        expect(result.message).to.contain('notNull');
      });

  });

 it('inventory defaults to 0', function () {
    return Product.create({
      name: 'Migratory Birds2',
      description: 'testing testing testing',
    }).then(function (savedProduct) {
      expect(savedProduct.inventory).to.equal(0);
    });
  });

 it('inventory cannot be less than 0', function () {
    var product = Product.build({
      name: 'Migratory Birds2',
      description: 'testing testing testing',
      inventory: -1
    })
    return product.validate()
    .then(function (result) {
        expect(result).to.be.an.instanceOf(Error);
        expect(result.message).to.contain('Validation error');
    });
  });


  it('can handle long description', function() {
    var description = 'WALL-E (stylized with an interpunct as WALL·E) is a 2008 American computer-animated science-fiction comedy film produced by Pixar Animation Studios and released by Walt Disney Pictures. Directed by Andrew Stanton, the story follows a robot named WALL-E, who is designed to clean up an abandoned, waste-covered Earth far in the future. He falls in love with another robot named EVE, who also has a programmed task, and follows her into outer space on an adventure that changes the destiny of both his kind and humanity. Both robots exhibit an appearance of free will and emotions similar to humans, which develop further as the film progresses.';
    return Product.create({
      name: 'WALL-E',
      description: description
    }).then(function(result) {
      expect(result).to.be.an('object');
      expect(result.name).to.equal('WALL-E');
      expect(result.description).to.equal(description);
    });
  });

});

//check out sequelize-express checkpoint for validation tests
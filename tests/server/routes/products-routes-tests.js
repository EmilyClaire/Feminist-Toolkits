// Instantiate all models
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var supertest = require('supertest');

describe('Products Route', function () {

  var app, User, Category, Review, Product;

  beforeEach('Sync DB', function () {
      return db.sync({ force: true });
  });

  beforeEach('Create products', function () {
      app = require('../../../server/app')(db);
      User = db.model('user');
      Category = db.model('category');
      Product = db.model('product');
  });

  beforeEach('Seed product database', function (){
    Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00})
    .then(function(){
      Product.create({ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 10, currentPrice: 100.00});
    })
    .then(function(){
      Product.create({ name: 'Unicorn floatie', description: 'Most comfy floatie', inventory: 30, currentPrice: 200.00});
    });

  });

  describe('Unauthenticated user request', function () {

    var guestAgent, checkCategories;

    beforeEach('Create guest agent', function () {
      guestAgent = supertest.agent(app);

      checkCategories = function (done){
         guestAgent.get('/api/categories')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(3);
          expect(res.body[0]).to.eql('banana');
          expect(res.body[1]).to.eql('apple');
          expect(res.body[2]).to.eql('pie');
          done();
        })
      };
    });


    it('should get with 200 response and with an array as the body containing'
       + ' banana, apple, pie' , function (done) {
         guestAgent.get('/api/categories')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(3);
          expect(res.body[0]).to.eql('banana');
          expect(res.body[1]).to.eql('apple');
          expect(res.body[2]).to.eql('pie');
          done();
        });
    });

    it('Try to add a category and get a 403 error', function (done){
      guestAgent.post('/api/categories').send({name: 'cheese'})
      .expect(403)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty();
        checkCategories();
        done();
      });
    });

  it('Try to edit a category and get a 403 error', function (done){
      guestAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(403)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty();
        checkCategories();
        done();
      });
    });

  it('Try to delete a category and get a 403 error', function (done){
      guestAgent.delete('/api/categories/1')
      .expect(403)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty();
        checkCategories();
        done();
      });
    });
  });

  describe('Authenticated request', function () {

    var loggedInAgent, checkCategories;

    var userInfo= {
      email: 'joe@gmail.com',
      password: 'shoopdawoop',
      name: 'Joe'
    };

    checkCategories = function (done){
       loggedInAgent.get('/api/categories')
      .expect(200)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.lengthOf(3);
        expect(res.body[0]).to.eql('banana');
        expect(res.body[1]).to.eql('apple');
        expect(res.body[2]).to.eql('pie');
        done();
      });
  };

    beforeEach('Create a user', function (done) {
      return User.create(userInfo).then(function () {
                done();
            }).catch(done);
    });

    beforeEach('Create loggedIn user agent and authenticate', function (done) {
      loggedInAgent = supertest.agent(app);
      loggedInAgent.post('/login').send(userInfo).end(done);
    });

    it('should get with 200 response and with an array as the body containing'
       + ' banana, apple, pie' , function (done) {
      loggedInAgent.get('/api/categories')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body).to.be.lengthOf(3);
        expect(res.body[0]).to.eql('banana');
        expect(res.body[1]).to.eql('apple');
        expect(res.body[2]).to.eql('pie');
        done();
      });
    });

    it('Try to add a category and get a 403 error', function (done){
      loggedInAgent.post('/api/categories').send({name: 'cheese'})
      .expect(403)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty();
        checkCategories();
        done();
      });
    });

  it('Try to edit a category and get a 403 error', function (done){
      loggedInAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(403)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty();
        checkCategories();
        done();
      });
    });

  it('Try to delete a category and get a 403 error', function (done){
      loggedInAgent.delete('/api/categories/1')
      .expect(403)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty();
        checkCategories();
        done();
      });
    });
  });

  describe('Admin request', function(){
    var adminAgent, getCategories;

      var admin = {
      email: 'emily@e.com',
      password: 'lucas',
      isAdmin: true,
      name: 'Emily'
    };

    getCategories = function(done){
      return adminAgent.get('/api/categories')
      .end(function(err, res){
        if(err) return done(err);

        return done(res.body);
      });
    }
    beforeEach('Create an admin', function (done){
        return User.create(admin).then(function () {
          done()
      }).catch(done);
    });

    beforeEach('Create adminAgent admin and authenticate', function (done) {
      adminAgent = supertest.agent(app);
      adminAgent.post('/login').send(admin).end(done);
    });

    it('should get with 200 response and with an array as the body containing'
       + ' banana, apple, pie' , function (done) {
      adminAgent.get('/api/categories')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body).to.be.lengthOf(3);
        expect(res.body[0]).to.eql('banana');
        expect(res.body[1]).to.eql('apple');
        expect(res.body[2]).to.eql('pie');
        done();
      });
    });

    it('Successfully Add a category', function (done){
      adminAgent.post('/api/categories').send({name: 'cheese'})
      .expect(201)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.equal({name: 'cheese'});
        expect(getCategories()).to.equal(['banana', 'apple', 'pie', 'cheese']);
        done();
      });
    });

  it('edit a category and get a 200 message', function (done){
      adminAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(200)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.eql({name: 'cheese'});
        expect(getCategories()).to.be.eql(['banana', 'cheese', 'pie', 'cheese'])
        done();
      });
    });

  it('delete a category and get a 200 message', function (done){
      adminAgent.delete('/api/categories/1')
      .expect(200)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.eql({name: 'cheese'});
        expect(getCategories()).to.be.eql(['banana', 'pie', 'cheese'])
        done();
      });
    });
  });
});

// Instantiate all models
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var supertest = require('supertest');
var Promise=require('bluebird');

describe('Reviews Route', function () {

    var app, User, Review, Product, productsArr, reviewsArr, user;

    beforeEach('Sync DB', function () {
        return db.sync({ force: true });
    });

    beforeEach('Create app', function () {
        app = require('../../../server/app')(db);
        User = db.model('user');
        Review = db.model('review');
        Product = db.model('product');
    });

	describe('Get reviews', function () {

    beforeEach(function (done) {
      var productProm1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
      var productProm2=Product.create({ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 10, currentPrice: 100.00});
      var reviewProm1=Review.create({
          stars: 5,
          content: 'the best damn unicorn i ever rode'});
      var reviewProm2=Review.create({
          stars: 1,
          content: 'the worst evilest robot i ever saw'});
      var userProm1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});

      Promise.all([productProm1,productProm2,reviewProm1,reviewProm2,userProm1])
      .spread(function(product1,product2,review1,review2,user1){
        productsArr=[product1,product2];
        reviewsArr=[review1,review2];
        user=user1;
        Promise.all([review1.setUser(user), review1.setProduct(product1)])
      })
      .then(done)
      .catch(function (err) {
        console.log('promise err', err)
      });
  });

		it('should get an array', function (done) {
			supertest(app).get('/api/reviews/product/' + reviewsArr[0].id)
				.expect(200)
        .expect(function(res) {
          if (!Array.isArray(res.body)) {
            throw new Error("Not an array")}
        })
				.end(done);
		});

    it('should get an array filtered by user', function (done) {
      supertest(app).get('/api/reviews/user/'+user.id)
        .expect(200)
        .expect(function(res) {
          if (!Array.isArray(res.body)) {
            throw new Error("Not an array")}
        })
        .end(done);
    });
	});

	describe('Authenticated user actions', function () {
    beforeEach(function (done) {
      var productProm1=Product.create({ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00});
      var productProm2=Product.create({ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 10, currentPrice: 100.00});
      var reviewProm1=Review.create({
          stars: 5,
          content: 'The best damn unicorn i ever rode'});
      var reviewProm2=Review.create({
          stars: 1,
          content: 'The worst evilest robot i ever saw'});
      var userProm1=User.create({email: 'bob@bob.com', name: 'bob', password:'ohman',isAdmin:'false'});

      Promise.all([productProm1,productProm2,reviewProm1,reviewProm2,userProm1])
      .spread(function(product1,product2,review1,review2,user1){
        productsArr=[product1,product2];
        reviewsArr=[review1,review2];
        user=user1;
        Promise.all([review1.setUser(user), review1.setProduct(product1)])
      })
      .then(done)
      .catch(function (err) {
        console.log('promise err', err)
      });
    });

		var loggedInAgent;

		var userInfo = {
			email: 'bob@bob.com',
			password: 'ohman',
      name: 'Bob'
		};
    var reviewToPost = {
      stars: 3,
      content: 'Product def exists. It is kinda okay.'
    }

		beforeEach('Create loggedIn user agent and authenticate', function (done) {
			loggedInAgent = supertest.agent(app);
			loggedInAgent.post('/login').send(userInfo).end(done);
		});

		it('should post with 201 response', function (done) {
			loggedInAgent.post('/api/reviews').send(reviewToPost).expect(201).end(function (err, response) {
				if (err) return done(err);
				expect(response.body.stars).to.equal(3);
				done();
			});
		});

    it('should delete with 204 response', function (done) {
      loggedInAgent.delete('/api/reviews/1')
      .expect(204)
      .end(function (err) {
        if (err) return done(err);
        done();
      })
      }
    );
    it('should not delete other user review', function (done) {
      loggedInAgent.delete('/api/reviews/2')
      .expect(401)
      .end(function (err) {
        if (err) return done(err);
        done();
      })
      }
    );

  });

})

  // var adminInfo = {
    //   email: 'admin@site.com',
    //   name: 'Ms. Admin',
    //   password: 'Imtheboss',
    //   isAdmin: true
    // }


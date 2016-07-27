// Instantiate all models
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var supertest = require('supertest');

describe('Reviews Route', function () {

    var app, User, Review, Product;

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

		it('should get an array', function (done) {
			app.get('/api/reviews')
				.expect(200)
        .expect(function(res) {
          if (!Array.isArray(res.body)) {
            throw new Error("Not an array")}
        })
				.end(done);
		});

    it('should get an array', function (done) {
      app.get('/api/reviews/user/123')
        .expect(200)
        .expect(function(res) {
          if (!Array.isArray(res.body)) {
            throw new Error("Not an array")}
        })
        .end(done);
    });
	});

	describe('Authenticated request', function () {

		var loggedInAgent;

		var userInfo = {
			email: 'joe@gmail.com',
			password: 'shoopdawoop'
		};

		beforeEach('Create a user', function (done) {
			return User.create(userInfo).then(function (user) {
                done();
            }).catch(done);
		});

		beforeEach('Create loggedIn user agent and authenticate', function (done) {
			loggedInAgent = supertest.agent(app);
			loggedInAgent.post('/login').send(userInfo).end(done);
		});

		it('should get with 200 response and with an array as the body', function (done) {
			loggedInAgent.get('/api/members/secret-stash').expect(200).end(function (err, response) {
				if (err) return done(err);
				expect(response.body).to.be.an('array');
				done();
			});
		});

	});

});

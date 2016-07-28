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
    });

	describe('Get reviews', function () {

    var review1 = {stars: 2, content: 'Twenty characters of content', userId: 1};
    var review2 = {stars: 4, content: 'Another twenty characters.', userId: 1}

    beforeEach('Post reviews', function(){
      Review.create(review1)
      .then(function () { Review.create(review2)})
      .catch(function (err) { console.log(err) });
    });


		it('should get an array', function (done) {
			supertest(app).get('/api/reviews')
				.expect(200)
        .expect(function(res) {
          if (!Array.isArray(res.body)) {
            throw new Error("Not an array")}
        })
				.end(done);
		});

    it('should get an array filtered by user', function (done) {
      supertest(app).get('/api/reviews/user/1')

        .expect(200)
        .expect(function(res) {
          if (!Array.isArray(res.body)) {
            throw new Error("Not an array")}
        })
        .end(done);
    });
	});

	describe('Authenticated user actions', function () {

		var loggedInAgent;

		var userInfo = {
			email: 'joe@gmail.com',
			password: 'shoopdawoop',
      name: 'User Guy'
		};
    var reviewToPost = {
      stars: 3,
      content: 'Product def exists. It is kinda okay.'
    }

		beforeEach('Create a user', function (done) {
			return User.create(userInfo).then(function (user) {
          done();
        }).catch(done);
		});

		beforeEach('Create loggedIn user agent and authenticate', function (done) {
			loggedInAgent = supertest.agent(app);
			loggedInAgent.post('/login').send(userInfo).end(done);
		});

		it('should post with 201 response', function (done) {

			loggedInAgent.post('/api/reviews').send(reviewToPost).expect(201).end(function (err, response) {

        // console.log(response.body);
				if (err) return done(err);
				expect(response.body.stars).to.equal(3);
        //test that userId gets returned, after relations are set up (uId==1??)
        //expect(response.body.userId).to.exist;
				done();
			});
		});

    it('should delete with 200 response', function (done) {
      loggedInAgent.delete('/api/reviews/2').expect(200).end(function (err, response) {
        if (err) return done(err);
        expect(response).to.equal(1);
        done();
      });
    });


	});
  // var adminInfo = {
    //   email: 'admin@site.com',
    //   name: 'Ms. Admin',
    //   password: 'Imtheboss',
    //   isAdmin: true
    // }
});

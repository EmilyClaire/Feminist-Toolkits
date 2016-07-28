var expect = require('chai').expect;

var db = require('../../../server/db');

var supertest = require('supertest');

describe('Categories Route', function () {

    var app, User, Category;

    beforeEach('Sync DB', function () {
        return db.sync({ force: true });
    });

    beforeEach('Create app', function () {
        app = require('../../../server/app')(db);
        User = db.model('user');
        Category = db.model('category');
    });

  beforeEach('Seed category database', function (){
    Category.create({name: 'banana'})
    .then(function(){
      Category.create({name: 'apple'});
    })
    .then(function(){
      Category.create({name: 'pie'});
    })
  });

  describe('Unauthenticated categories request', function () {

    var guestAgent;

    beforeEach('Create guest agent', function () {
      guestAgent = supertest.agent(app);
    });

    it('should get an array of Categories', function (done) {
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
    });
  });

  describe('Authenticated request', function () {

    var loggedInAgent;

    var userInfo= {
      email: 'joe@gmail.com',
      password: 'shoopdawoop',
      name: 'Joe'
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

    it('should get with 200 response and with an array as the body', function (done) {
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
  });

  describe('Admin request', function(){
    var adminAgent;

      var admin = {
      email: 'emily@e.com',
      password: 'lucas',
      isAdmin: true,
      name: 'Emily'
    };

    beforeEach('Create an admin', function (done){
        return User.create(admin).then(function () {
          done()
      }).catch(done);
    });

    beforeEach('Create admenAgent admin and authenticate', function (done) {
      adminAgent = supertest.agent(app);
      adminAgent.post('/login').send(admin).end(done);
    });

    it('should get with 200 response and with an array as the body', function (done) {
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
  });
});

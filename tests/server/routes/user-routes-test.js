var expect = require('chai').expect;
var Sequelize = require('sequelize');
var db = require('../../../server/db');
var supertest = require('supertest');

describe('Users Route', function () {
  var app, User;
  var adminInfo = {
    email: 'admin@site.com', name: 'Ms. Admin',
    password: 'Imtheboss', isAdmin: true
  }
  var userInfo = {
    email: 'joe@gmail.com',
    password: 'shoopdawoop', name: 'User Guy'
  };

  beforeEach('Sync DB', function () {
      return db.sync({ force: true });
  });

  beforeEach('Create app', function () {
      app = require('../../../server/app')(db);
      User = db.model('user');
  });

  beforeEach('Create regular and admin user', function (done) {
    return User.create(userInfo)
    .then(function () {
      return User.create(adminInfo)})
    .then(function(){
      done(); })
  });

  describe('for admin', function () {
    beforeEach('logs in admin', function(){
      var loggedInAdmin = supertest.agent(app);
      loggedInAdmin.post('/login')
      .send(adminInfo)
    })

    it('returns user list', function(done){
      supertest(app).get('/api/users')
      .expect(200)
      .expect(function(res) {
        if (!Array.isArray(res.body)) {
          throw new Error("Not an array")}
      })
      done();
    });

    it('returns single user', function(done) {
      supertest(app).get('/api/users/1')
      .expect(200)
      .expect(function(res) {
        console.log(res);
      })
      done();
    });

  });

  describe('for non-admin', function(){
    beforeEach('logs in ordinary user', function(){
      var loggedInAgent = supertest.agent(app);
      loggedInAgent.post('/login')
      .send(userInfo)
    });

    it('does not return user list', function(done){
      supertest(app).get('/api/users')
      .expect(401)
      done();
    });

    it('does not return single user', function(done){
      supertest(app).get('/api/users/1')
      .expect(401)
      done();
    });

  });

  describe('User creation',function () {
    it('fails if email is already registered',function(done) {
      supertest(app).post('/api/users').send(userInfo)
      .expect(409)
      done();
    })

    it('creates new account', function(done){
      var newUser = {name: "Judy", email: "judy@gmail.com", password: "juddy"};
      supertest(app).post('/api/users').send(newUser)
      .expect(201)
      .expect(function(res){
        res.body.should.have.property("name", "Judy")
      })
      done();
    })

  })

  ///Now do PUT !!

});

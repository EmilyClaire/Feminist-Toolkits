var expect = require('chai').expect;
var Sequelize = require('sequelize');
var db = require('../../../server/db');
var supertest = require('supertest');

describe('Users Route', function () {
  var app, User;

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

  beforeEach('Create regular user', function (done) {
    return User.create(userInfo)
    .then(function(){
      done(); })
    .catch(done);
  });

  describe('for admin', function () {
    // var loggedInAdmin;
    // var adminInfo = { email: 'emily@e.com',
    //   password: 'lucas',
    //   isAdmin: true,
    //   name: 'Emily' }

    // beforeEach('Create admin user', function (done){
    //   return User.create(adminInfo)
    //   .then(function(){
    //     done(); })
    //   .catch(done);

    // });

    // beforeEach('logs in admin', function(done){
    //   loggedInAdmin = supertest.agent(app);
    //   return loggedInAdmin.post('/login')
    //   .send(adminInfo).end(done)
    //   done();
    // })
  var loggedInAdmin;

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

    beforeEach('Create loggedInAdmin admin and authenticate', function (done) {
      loggedInAdmin = supertest.agent(app);
      loggedInAdmin.post('/login').send(admin).end(done);
    });

    it('returns user list', function(done){
      supertest(app).get('/api/users')
      .expect(200)
      .expect(function(res) {
        if (!Array.isArray(res.body)) {
          throw new Error("Not an array")}
      })
      .end(function(err) {console.log(err)});
      done()
    });

    it('returns single user', function(done) {
      supertest(app).get('/api/users/1')
      .expect(200)
      .expect(function(res){
        console.log(res)
      })
      done();
    });

    it('updates user information', function(done){
      supertest(app).put('/api/users/1').send({name: "Joeyyy"})
      .expect(201)
      done();
    })

  });

  describe('for non-admin', function(){
    beforeEach('logs in ordinary user', function(done){
      var loggedInAgent = supertest.agent(app);
      loggedInAgent.post('/login')
      .send(userInfo).end(done)
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


});

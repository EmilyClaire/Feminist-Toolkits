var expect = require('chai').expect;
var Sequelize = require('sequelize');
var db = require('../../../server/db');
var supertest = require('supertest');

describe('Users Route', function () {
  var app, User;

  var userInfo = {
    email: 'testGuy@gmail.com',
    password: 'testuser', name: 'Testuser Guy'
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
      loggedInAdmin.get('/api/users')
      .expect(200)
      .end(function(err,res){
        if (err) {done(err); }
        expect(res.body).to.have.lengthOf(2);
        done();
      });
    });

    it('returns single user', function(done) {
      loggedInAdmin.get('/api/users/1')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        expect(res.body).to.exist;
        expect(res.body.name).to.equal('Testuser Guy');
        done();
      });
    });

    it('updates user information', function(done){
      loggedInAdmin.put('/api/users/1').send({name: "Joeyyy"})
      .expect(201)
      .end(done);
    })

  });

  describe('for non-admin', function(){
    var loggedInAgent;
    beforeEach('logs in ordinary user', function(done){
      loggedInAgent = supertest.agent(app);
      loggedInAgent.post('/login')
      .send(userInfo).end(done)
    });

    it('does not return user list', function(done){
      loggedInAgent.get('/api/users')
      .expect(401)
      .end(done);
    });

    it('does not return another user', function(done){
      loggedInAgent.get('/api/users/2')
      .expect(401)
      .end(done);
    });

    it('updates user information', function(done){
      loggedInAgent.put('/api/users/1').send({name: "Joey"})
      .expect(201)
      .end(done);
    })

  });

  describe('User creation',function () {

    it('fails if email is already registered',function(done) {
      supertest(app).post('/api/users').send(userInfo)
      .expect(409)
      .end(function (err) {
        if (err) { done(err); }
        else done();
      });
    })

    it('creates new account', function(done){
      var newUser = {name: "Judy", email: "judy@gmail.com", password: "juddy"};
      supertest(app).post('/api/users').send(newUser)
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body.name).to.equal("Judy");
        done();
      });
    })

  })


});

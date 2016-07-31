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

    beforeEach('Create a user', function (done) {
      return User.create(userInfo)
      .then(function () {
        return User.create(adminInfo)})
      .then(function(){
        done(); })
      .catch(done);
    });


  it('gets array of users for admin', function (done) {
    var loggedInAdmin = supertest.agent(app);
    loggedInAdmin.post('/login')
    .send(adminInfo)
    .then(function(){
      loggedInAdmin.get('/api/users')
      .expect(200)
      .expect(function(res) {
        if (!Array.isArray(res.body)) {
          throw new Error("Not an array")}
      })
      .end(done);
    })

  })

  it('does not return user list for non-admin', function(done){
    var loggedInAgent = supertest.agent(app);
    loggedInAgent.post('/login').send(userInfo).end(done);

    supertest(app).get('/api/users')
    .expect(401)
    .end(done);
  });

});

var expect = require('chai').expect;

var db = require('../../../server/db');

var supertest = require('supertest');

var Promise = require('bluebird');

describe('Categories Route', function () {

    var app, User, Category, cat1, cat2, cat3, catArr;

    catArr = new Array(4);

    beforeEach('Sync DB', function () {
        return db.sync({ force: true });
    });

    beforeEach('Create app', function () {
        app = require('../../../server/app')(db);
        User = db.model('user');
        Category = db.model('category');
    });

  beforeEach('Seed category database', function (){
    Promise.all([Category.create({name: 'banana'}), Category.create({name: 'apple'}),
                Category.create({name: 'pie'})])
    .then(function(promiseArr){
      cat1 = promiseArr[0];
      cat2 = promiseArr[1];
      cat3 = promiseArr[2];

      catArr[cat1.id] = cat1;
      catArr[cat2.id] = cat2;
      catArr[cat3.id] = cat3;

      catArr = catArr.map(function(value){
        value = {
          id: value.id,
          name: value.name
        };

        return value;
      })
    });
  });

  describe('Unauthenticated user request', function () {

    var guestAgent;

    beforeEach('Create guest agent', function () {
      guestAgent = supertest.agent(app);

    });


    it('should get with 200 response and with an array as the body containing'
       + ' banana, apple, pie' , function (done) {
         guestAgent.get('/api/categories')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);

        var arr = res.body.map(function(value){
          value = {
            id: value.id,
            name: value.name
          };
          return value;
        });

        expect(arr).to.be.an('array');
        expect(arr).to.have.lengthOf(3);
        expect(arr).to.contain(catArr[1]);
        expect(arr).to.contain(catArr[2]);
        expect(arr).to.contain(catArr[3]);
        done();
      });
    });

    it('Try to add a category and get a 401 error', function (done){
      guestAgent.post('/api/categories').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
        done();
      });
    });

  it('Try to edit a category and get a 401 error', function (done){
      guestAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
        done();
      });
    });

  it('Try to delete a category and get a 401 error', function (done){
      guestAgent.delete('/api/categories/1')
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
        done();
      });
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

    it('should get with 200 response and with an array as the body containing'
       + ' banana, apple, pie' , function (done) {
      loggedInAgent.get('/api/categories')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);

        var arr = res.body.map(function(value){
          value = {
            id: value.id,
            name: value.name
          };
          return value;
        });

        expect(arr).to.be.an('array');
        expect(arr).to.have.lengthOf(3);
        expect(arr).to.contain(catArr[1]);
        expect(arr).to.contain(catArr[2]);
        expect(arr).to.contain(catArr[3]);
        done();
      });
    });

    it('Try to add a category and get a 401 error', function (done){
      loggedInAgent.post('/api/categories').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
        done();
      });
    });

  it('Try to edit a category and get a 401 error', function (done){
      loggedInAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
        done();
      });
    });

  it('Try to delete a category and get a 401 error', function (done){
      loggedInAgent.delete('/api/categories/1')
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
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

    beforeEach('Create adminAgent admin and authenticate', function (done) {
      adminAgent = supertest.agent(app);
      adminAgent.post('/login').send(admin).end(done);
    });

    it('should get with 200 response and with an array as the body containing'
       + ' banana, apple, pie' , function (done) {
      adminAgent.get('/api/categories')
      .expect(200)
      .end(function(err, res){
        if(err) return done(err);

      var arr = res.body.map(function(value){
        value = {
          id: value.id,
          name: value.name
        };
        return value;
      });

      expect(arr).to.be.an('array');
      expect(arr).to.have.lengthOf(3);
      expect(arr).to.contain(catArr[1]);
      expect(arr).to.contain(catArr[2]);
      expect(arr).to.contain(catArr[3]);
      done();
    });
  });

    it('Successfully Add a category', function (done){
      adminAgent.post('/api/categories').send({name: 'pizza'})
      .expect(201)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body.name).to.equal('pizza');
        Category.findOne({
          where: {
            name: 'pizza'
          }
        })
        .then(function(result){
          expect(result.name).to.eql('pizza');
        })
        .catch(err);
        done();
      });
    });

  it('edit a category and get a 200 message', function (done){
      adminAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(201)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body.name).to.be.empty;
        Category.findOne({
          where: {
            id: 1
          }
        })
        .then(function(result){
          expect(result.name).to.eql('cheese');
        })
        .catch(err);
        done();
      });
    });

  it('delete a category and get a 200 message', function (done){
      adminAgent.delete('/api/categories/1')
      .expect(204)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body.name).to.be.empty;

        Category.findOne({
          where: {
            name: 'pizza'
          }
        })
        .then(function(result){
          expect(result).to.eql(null);
        }).catch(err);

        done();
      });
    });
  });
});

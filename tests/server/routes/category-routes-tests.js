var expect = require('chai').expect;

var db = require('../../../server/db');

var supertest = require('supertest');

var Promise = require('bluebird');

xdescribe('Categories Route', function () {

    var app, User, Category, catArr;

    catArr = new Array(3);

    var usefulArr = function(arr){
        var newArr = [];
        arr = arr.map(function(value){
        value = {
          id: value.id,
          name: value.name
        };

        newArr[value.id - 1] = value;

        return value;
      })

      return newArr;
    }

    var getAll = function(Cat){
      var all = [];

      return Cat.findAll()
      .then(function(categories){
        all = usefulArr(categories);
        return all;
      })

    };

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
      catArr = usefulArr(promiseArr);
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

          var arr = usefulArr(res.body);

          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr).to.contain(catArr[0]);
          expect(arr).to.contain(catArr[1]);
          expect(arr).to.contain(catArr[2]);
          done();
      });
    });

    it('Try to add a category and get a 401 error', function (done){
      guestAgent.post('/api/categories').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
        })
        .catch(err);
        done();
      });
    });

  it('Try to edit a category and get a 401 error', function (done){
      guestAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
        })
        .catch(err);
        done();
      });
    });

  it('Try to delete a category and get a 401 error', function (done){
      guestAgent.delete('/api/categories/1')
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
        })
        .catch(err);
        done();
      });
    });
  });

  xdescribe('Authenticated request', function () {

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

          var arr = usefulArr(res.body);

          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr).to.contain(catArr[0]);
          expect(arr).to.contain(catArr[1]);
          expect(arr).to.contain(catArr[2]);
          done();
        });
    });

    it('Try to add a category and get a 401 error', function (done){
      loggedInAgent.post('/api/categories').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
        })
        .catch(err);
        done();
      });
    });

  it('Try to edit a category and get a 401 error', function (done){
      loggedInAgent.put('/api/categories/1').send({name: 'cheese'})
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
        })
        .catch(err);
        done();
      });
    });

  it('Try to delete a category and get a 401 error', function (done){
      loggedInAgent.delete('/api/categories/1')
      .expect(401)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body).to.be.empty;
        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
        })
        .catch(err);
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

          var arr = usefulArr(res.body);

          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr).to.contain(catArr[0]);
          expect(arr).to.contain(catArr[1]);
          expect(arr).to.contain(catArr[2]);
          done();
        });
    });

    it('Successfully Add a category', function (done){
      adminAgent.post('/api/categories').send({name: 'pizza'})
      .expect(201)
      .end(function(err, res){
        if(err) return done(err);
        expect(res.body.name).to.equal('pizza');
        catArr.push({id: 4, name: 'pizza'});

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(4);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
          expect(arr[3]).to.eql(catArr[3]);
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
        catArr[0] = {id: 1, name: 'cheese'};

        getAll(Category)
        .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(3);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          expect(arr[2]).to.eql(catArr[2]);
          })
        .catch(err);
        done();
      })
    });

  it('delete a category and get a 200 message', function (done){
      adminAgent.delete('/api/categories/3')
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
        })
        .then(function(){
          getAll(Category)
          .then(function(arr){
          expect(arr).to.be.an('array');
          expect(arr).to.have.lengthOf(2);
          expect(arr[0]).to.eql(catArr[0]);
          expect(arr[1]).to.eql(catArr[1]);
          })
        })
        .catch(err);
        done();
      });
    });
  });
});

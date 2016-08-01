var expect = require('chai').expect;

var db = require('../../../server/db');

var supertest = require('supertest');

var Promise=require('bluebird');

describe('Orders Routes', function () {

    var app, User,Order,Product,product1,product2;

    beforeEach('Sync DB', function () {
        return db.sync({ force: true });
    });

    beforeEach('Create app', function () {
        app = require('../../../server/app')(db);
        User = db.model('user');
        Order = db.model('order'); 
        Product=db.model('product');
    });
    beforeEach('Seed order database', function (){
      var user1;
      var user2;
      var user1Info= {
        email: 'joe@gmail.com',
        password: 'shoopdawoop',
        name: 'Joe'
      };
      var user2Info= {
        email: 'meaniepants@gmail.com',
        password: 'i_hate_everything',
        name: 'ONE MEAN DUDE'
      };
      var user3Info= {
        email: 'emily@e.com',
        password: 'lucas',
        isAdmin: true,
        name: 'Emily'
      };

      var product1Info={ name: 'Unicorn robot', description: 'Most beautiful creature', inventory: 10, currentPrice: 100.00};
      var product2Info={ name: 'Unicorn puppy', description: '2nd most beautiful creature', inventory: 100, currentPrice: 10.00};

      var productPromises=[Product.create(product1Info),Product.create(product2Info)];
      var orderPromises=[Order.create({shippingAddress: 'Banana City'}),Order.create({shippingAddress: 'Apple City'}),Order.create({shippingAddress: 'Pie City'})]
      var userPromises=[User.create(user1Info),User.create(user2Info),User.create(user3Info)];
      Promise.all(userPromises)
      .spread(function(user1Result,user2Result,user3Result){
        user1=user1Result;
        user2=user2Result;
      })
      .then(function(){
        return Promise.all(productPromises)
      })  
      .then(function(products){
        product1=products[0];
        product2=products[1];
        return Promise.all(orderPromises)
      })  
      .then(function(orders){
        orders[0].setUser(user1); //joe ordered to bananaCity, order1
        return orders[1].setUser(user2); //ONE MEAN DUDE ordered to Apple City, order2
      })

  });

  describe('Unauthenticated user request', function () {

    var guestAgent;

    beforeEach('Create guest agent', function () {
      guestAgent = supertest.agent(app);
    });


    it('cannot get all orders - 401' , function (done) {
         guestAgent.get('/api/orders')
        .expect(401)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
    it('cannot get an individual order - 401' , function (done) {
         guestAgent.get('/api/orders/1')
        .expect(401)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
    describe('can post an order',function(){
      it('gets 201 for a filled out order' , function (done) {
        guestAgent.post('/api/orders').send({name: 'Imaguest',shippingAddress:'my house', email:'bob@bob.com',products:[product1,product2]})
        .expect(201)
        .end(function(err, res){
          if(err) return done(err);
          expect(res.body.shippingAddress).to.eql('my house');
          done();
        });
      });
      it('gets 500 for an incomplete order' , function (done) {
        guestAgent.post('/api/orders').send({name: 'Imaguest', email:'bob2@bob.com',products:[product1,product2]})
        .expect(500)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
      });
    })
    it('cannot delete an order' , function (done) {
         guestAgent.delete('/api/orders/1')
        .expect(401)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
    it('cannot edit an order' , function (done) {
         guestAgent.put('/api/orders/1').send({shippingAddress:'MY house'})
        .expect(401)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
  });

  describe('Authenticated request', function () {

    var loggedInAgent, checkCategories;
    var loggedInAgentId;
    var userInfo= {
      email: 'joe@gmail.com',
      password: 'shoopdawoop',
    };

    beforeEach('Create loggedIn user agent and authenticate', function (done) {
      loggedInAgent = supertest.agent(app);
      loggedInAgent.post('/login').send(userInfo).end(done);
    });

    beforeEach('get id of logged in user', function () {
      return User.findOne({where: {email: userInfo.email}})
      .then(function(user){
        loggedInAgentId=user.id;
      })
    });

    it('cannot get all orders - 401' , function (done) {
         loggedInAgent.get('/api/orders')
        .expect(401)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
    it('cannot get an individual order that belongs to another user - 401' , function (done) {
        Order.findOne({
          where:
            {userId: 
              {$ne: loggedInAgentId}
            }
          })
        .then(function(order){
          loggedInAgent.get('/api/orders/'+order.id) 
          .expect(401)
          .end(function(err, res){
            if(err) return done(err);
            done();
          });          
        })
    });
    it('can get an individual order that belongs to them - 200' , function (done) {
        Order.findOne({
          where:
            {userId:loggedInAgentId}
          })
        .then(function(order){
          loggedInAgent.get('/api/orders/'+order.id) 
          .expect(200)
          .end(function(err, res){
            if(err) return done(err);
            done();
          });          
        })
    });
    it('can post an order' , function (done) {
        loggedInAgent.post('/api/orders').send({name: 'whatevs',shippingAddress:'my house', email:'bobby@bob.com',products: [product1,product2]})
        .expect(201)
        .end(function(err, res){
          if(err) return done(err);
          expect(res.body.shippingAddress).to.eql('my house');
          expect(res.body.products).to.be.an('array');
          expect(res.body.products).to.have.lengthOf(2);
          var productNames=res.body.products.map(function(product){
            return product.name;
          })
          expect(productNames).to.contain('Unicorn puppy');
          expect(productNames).to.contain('Unicorn robot');
          done();
        });
      });
    it("cannot delete another user's order" , function (done) {
        Order.findOne({
          where:
            {userId: 
              {$ne: loggedInAgentId}
            }
          })
        .then(function(order){
          loggedInAgent.delete('/api/orders/'+order.id) 
          .expect(401)
          .end(function(err, res){
            if(err) return done(err);
            done();
          });          
        })
    });
    it("can delete own order - 204" , function (done) {
        Order.findOne({
          where:
            {userId: loggedInAgentId}
          })
        .then(function(order){
          loggedInAgent.delete('/api/orders/'+order.id) 
          .expect(204)
          .end(function(err, res){
            if(err) return done(err);
            done();
          });          
        })
    });
    it("cannot edit an order" , function (done) {
        loggedInAgent.put('/api/orders/1').send({shippingAddress:'MY house'})
        .expect(401)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
  });

  describe('Admin request', function(){
    var adminAgent, getOrders;

    var admin = {
      email: 'emily@e.com',
      password: 'lucas'
    };
    beforeEach('Create adminAgent admin and authenticate', function (done) {
      adminAgent = supertest.agent(app);
      adminAgent.post('/login').send(admin).end(done);
    });
    getOrders = function(done){
      return adminAgent.get('/api/orders')
      .end(function(err, res){
        if(err) return done(err);
        return done(res.body);
      });
    }

    it('can get all orders - 200' , function (done) {
         adminAgent.get('/api/orders')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);
          expect(res.body[0].products).to.be.an('array');
          expect(res.body).to.be.an('array')
          expect(res.body).to.have.lengthOf(3);
          var shippingAddresses=res.body.map(function(order){
            return order.shippingAddress;
          })
          expect(shippingAddresses).to.contain('Banana City');
          expect(shippingAddresses).to.contain('Pie City');
          expect(shippingAddresses).to.contain('Apple City');
          done();
        });
    });
    it('can get an individual order that does not belong to them - 200' , function (done) {
         adminAgent.get('/api/orders/1')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
    it('can delete individual order that does not belong to them - 204' , function (done) {
         adminAgent.delete('/api/orders/1')
        .expect(204)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
    it('can edit an individual order that does not belong to them - 200' , function (done) {
         adminAgent.get('/api/orders/1')
        .expect(200)
        .end(function(err, res){
          if(err) return done(err);
          done();
        });
    });
  });
});


 
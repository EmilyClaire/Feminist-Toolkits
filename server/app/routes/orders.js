'use strict';
var router = require('express').Router();
var Order=require('../../db/models/order.js');
var User=require('../../db/models/user.js');
var Product=require('../../db/models/product.js');
var OrderProduct=require('../../db/models/order-products.js');


var Promise=require('bluebird');

var utils=require('./utils');
var ensureAuthenticated=utils.ensureAuthenticated;
var ensureAppropriateUser=utils.ensureAppropriateUser;
var ensureAdmin=utils.ensureAdmin;


router.get('/',ensureAdmin, function (req, res,next) {
    Order.findAll()
    .then(function(orders){
        res.send(orders);
    })
    .catch(next);
});

router.get('/:id',ensureAuthenticated,function (req, res,next) {
    Order.findById(req.params.id)
    .then(function(order){
        if(!order){
            res.sendStatus(404);
        }
        else if(!(ensureAppropriateUser(req,order)||req.user.isAdmin)){ //when stephanie adds utils, can use her helper function
            res.sendStatus(401);
        }
        else{
            res.send(order);
        }
    })
    .catch(next);
});

router.post('/',function (req, res,next) {
    //req.body should contain shippingAddress, name, email, items
    var userPromise;
    var orderPromise;
    var orderId;
    var ids=req.body.products.map(function(product){return product.id})
    var prices=req.body.products.map(function(product){return product.currentPrice})
    var quantitites=req.body.products.map(function(product){return product.quantity})

    userPromise=User.findOrCreate({
        where:
            {email: req.body.email},
        defaults:
            {name: req.body.name, password: generateRandomPassword()}
    })
    orderPromise=Order.create({shippingAddress:req.body.shippingAddress});
    Promise.all([userPromise,orderPromise])
    .spread(function(findCreateResult,order){
        if(!req.isAuthenticated()){
            var user=findCreateResult[0];
        } else{ user=req.user}
        orderId=order.id;
        return order.setUser(user);
    })
    .then(function(order){
        var productsPromises=[]
        for (var i=0; i<ids.length; i++){
            productsPromises.push(order.setProducts(ids[i],{priceAtPurchase: prices[i],quantity: quantitites[i]}));
        }
        return Promise.all(productsPromises);
    })
    .then(function(order){
        return Order.findById(orderId);
    })
    .then(function(order){
        res.status(201).send(order);
    })
    .catch(next);

});

router.delete('/:id',function(req,res,next){
    Order.findById(req.params.id)
    .then(function(order){
        if((req.user&&req.user.isAdmin)||ensureAppropriateUser(req,order)){
            return Order.destroy({where: {id: req.params.id}})
        }
    })
    .then(function(order){
        if(order){
            res.sendStatus(204);
        }
        else{
            res.sendStatus(401);
        }
    })
    .catch(next);
});

router.put('/:id',ensureAdmin,function(req,res,next){
    Order.findById(req.params.id)
    .then(function(order){
        return order.update({status:req.body.status})
    })
    .then(function(){
        res.sendStatus(204);
    })
    .catch(next);
});

var generateRandomPassword=function(){
    return Math.random().toString(36).substr(2, 8);
}

module.exports = router;

var sinon = require('sinon');
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var Order = db.model('order');

describe('Order model', function () {

    beforeEach('Sync DB', function () {
       return db.sync({ force: true });
    });

    // Our tests below:
    describe('order creation and validation', function () {

        var buildInvalidOrder = Order.build({});
        var buildValidOrder = Order.build({ shippingAddress: '123 Gracehopper Place' });

        it('rejects an order that has no address', function () {
            return buildInvalidOrder.validate()
            .then(function (response){
                expect(response).to.be.an.instanceOf(Error);
            })
        });

        it('successfully creates an order that has a shipping address', function () {
           return buildValidOrder.save()
           .then(function (savedOrder) {
            expect(savedOrder.shippingAddress).to.equal(buildValidOrder.shippingAddress);
           })
        });

    });
});

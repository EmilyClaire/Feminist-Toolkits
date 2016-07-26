var sinon = require('sinon');
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var Review = db.model('review');

describe('Review model', function () {

    beforeEach('Sync DB', function () {
        return db.sync({ force: true });
    });

    it('creates a review',
        function (){
            return Review.create({stars: 3, content: 'This is the best. 1234567890.'})
            .then(function(response){
                expect(response.stars).to.exist;
            })
        }
    );

    it('Stars # must be less than 6', function () {
        return Review.create({stars: 7, content: 'This is terrible. 1234567890.'})
        .then(function(result){
            expect(result).to.not.exist;
        })
        .catch(function(err){
            expect(err).to.exist;
            console.log('err',err);
            expect(err.errors[0]).to.equal('')
        })
    });
    it('Stars # must be greater than 0', function () {
        return Review.create({stars: 0, content: 'This is just awful. 1234567890.'})
        .then(function(response){
            expect(response).to.be.an.instanceOf(Error);
        })

    })

    it('content must be at least 20 chars', function () {
       return Review.create({stars: 4, content: 'Bad.'})
        .then(function(response){
            console.log('shortreview', response);
            expect(response).to.be.an.instanceOf(Error);
        })
    })

});

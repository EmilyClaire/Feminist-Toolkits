'use strict';


var expect = require('chai').expect;
var request = require('supertest');
var app = require('../../../server/app');
var Category = require('../../../server/db/models/category');
var agent = request.agent(app);
var db = require('../../../server/db/_db');

/**
 *
 * Category Route Tests
 *
 */
describe('Categories Route:', function () {

  /**
   * First we clear the database before beginning each run
   */
  before(function () {
    return db.sync({force: true});
  });

  describe('GET /categories', function () {
    /**
     * Problem 1
     * We'll run a GET request to /categories
     *
     *   Because there isn't anything in the DB, it should be an empty array
     *
     * Consider using app.param to automatically load
     * in the Category whenever a param :id is detected
     */
    it('responds with an array via JSON', function () {

      return agent
        .get('/categories')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function (res) {
          // res.body is the JSON return object
          expect(res.body).to.be.an.instanceOf(Array);
          expect(res.body).to.have.length(0);
        });
    });

    /**
     * Problem 2
     * Save a category in the database using our model and then retrieve it
     * using the GET /categories route
     *
     */
    it('returns an a category if there is one in the DB', function () {

      var category = Category.build({
        name: 'Banana'
      });

      return category.save().then(function () {

        return agent
          .get('/categories')
          .expect(200)
          .expect(function (res) {
            expect(res.body).to.be.an.instanceOf(Array);
            expect(res.body[0].name).to.equal('Banana');
          });

      });

    });

    /**
     * Save a second category in the database using our model, then retrieve it
     * using the GET /articles route
     *
     */
    it('returns another article if there is one in the DB', function () {

      var category = Category.build({
        name: 'Another Test Category'
      });

      return category.save().then(function () {

        return agent
          .get('/categories')
          .expect(200)
          .expect(function (res) {
            expect(res.body).to.be.an.instanceOf(Array);
            expect(res.body[0].name).to.equal('Banana');
            expect(res.body[1].name).to.equal('Another test Category');
          });

      });

    });

  });

  /**
   * Search for articles by ID
   */
  describe('GET /articles/:id', function () {

    var article;

    // create another article for test
    before(function () {

      article = Article.build({
        title: 'Second Article',
        content: 'This article is good'
      });

      return article.save();

    });

    /**
     * This is a proper GET /articles/ID request
     * where we search by the ID of the article created above
     */
    it('returns the JSON of the article based on the id', function () {
      return agent
        .get('/articles/' + article.id)
        .expect(200)
        .expect(function (res) {
          if (typeof res.body === 'string') {
            res.body = JSON.parse(res.body);
          }
          expect(res.body.title).to.equal('Second Article');
        });
    });

    /**
     * Here we pass in a bad ID to the URL, we should get a 404 error
     */
    it('returns a 404 error if the ID is not correct', function () {
      return agent
        .get('/articles/' + '74')
        .expect(404);
    });

  });

  /**
   * Series of tests to test creation of new Articles using a POST
   * request to /articles
   */
  describe('POST /articles', function () {

    /**
     * Test the creation of an article
     * Here we don't get back just the article, we get back a Object
     * of this type:
     *
     * {
     *   message: 'Created successfully'
     *   article: {
     *     id: ...
     *     title: ...
     *     content: ...
     *   }
     * }
     */
    it('creates a new article', function () {
      return agent
        .post('/articles')
        .send({
          title: 'Awesome POST-Created Article',
          content: 'Can you believe I did this in a test?'
        })
        .expect(200)
        .expect(function (res) {
          expect(res.body.message).to.equal('Created successfully');
          expect(res.body.article.id).to.not.be.an('undefined');
          expect(res.body.article.title).to.equal('Awesome POST-Created Article');
        });
    });

    // This one should fail with a 500 because we don't set the article.body
    it('does not create a new article without a body', function () {
      return agent
        .post('/articles')
        .send({
          title: 'This Article Should Not Be Allowed'
        })
        .expect(500);
    });

    // Check if the articles were actually saved to the database
    it('saves the article to the DB', function () {

      return Article.findOne({
        where: {
          title: 'Awesome POST-Created Article'
        }
      }).then(function (article) {
        expect(article).to.exist;
        expect(article.content).to.equal('Can you believe I did this in a test?');
      });

    });

  });

  /**
   * Series of tests to test updating of Categores using a PUT
   * request to /categories/:id
   */
  describe('PUT /categories/:id', function () {

    var category;

    before(function () {

      return Category.findOne({
        where: {
          name: 'Awesome POST-Created Category'
        }
      }).then(function (_category) {
        catergory = _category;
      }).catch(function(e) { console.error(e.message); });
    });

    /**
     * Test the updating of an Category
     * Here we don't get back just the category, we get back a Object
     * of this type:
     *
     * {
     *   message: 'Updated successfully'
     *   Category: {
     *     id: ...
     *     name: ...
     *   }
     * }
     */
    it('updates a category', function () {

      return agent
        .put('/categories/' + category.id)
        .send({
          title: 'Awesome PUT-Updated Category'
        })
        .expect(200)
        .expect(function (res) {
          expect(res.body.message).to.equal('Updated successfully');
          expect(res.body.category.id).to.not.be.an('undefined');
          expect(res.body.category.name).to.equal('Awesome PUT-Updated Category');
        });

    });

    it('saves updates to the DB', function () {

      return Category.findById (category.id).then(function (category) {
        expect(category).to.exist;
        expect(category.name).to.equal('Awesome PUT-Updated Article');
      });

    });

    it('gets 500 for invalid update', function () {
      return agent
        .put('/categories/' + category.id)
        .send({ name: '' })
        .expect(500);
    });

  });

});

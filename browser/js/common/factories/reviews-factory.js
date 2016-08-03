'use strict';

app.factory('ReviewsFactory', function ($http, Session) {

  var ReviewsFactory = {};

  function getData (response) {
    return response.data;
  }

ReviewsFactory.addReview = function(stars, review, productId){
    return $http.post("api/reviews/", {productId: productId,
        stars: stars, content: review, userId: Session.user.id})
    .then(getData)
  };

  ReviewsFactory.fetchAll = function (productId) {
    return $http.get('/api/products/' + productId + '/reviews')
    .then(getData);
  };

  return ReviewsFactory;
});

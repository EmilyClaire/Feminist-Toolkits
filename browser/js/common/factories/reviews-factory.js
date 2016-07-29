'use strict';

app.factory('ReviewsFactory', function ($http) {

  var ReviewsFactory = {};

  function getData (response) {
    return response.data;
  }

  ReviewsFactory.fetchAll = function (productId) {
    return $http.get('/api/products/' + productId + '/reviews')
    .then(getData);
  };

  return ReviewsFactory;

});

'use strict';

app.factory('UserFactory', function ($http) {

  var UserFactory = {};

  function getData (response) {
    return response.data;
  }

  UserFactory.fetchById = function (id) {
    return $http.get('/api/users/'+id)
    .then(getData);
  };
  UserFactory.fetchAll = function () {
    return $http.get('/api/users/')
    .then(getData);
  };
  return UserFactory;

});

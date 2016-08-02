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

  return UserFactory;

});

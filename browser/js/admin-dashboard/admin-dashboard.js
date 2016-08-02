app.config(function ($stateProvider) {
  $stateProvider.state('admin-dashboard',{
    url: '/admin/dashboard',
    templateUrl: '/js/admin-dashboard/admin-dashboard.html',
    controller: 'admin-dashboard'
  })

});

app.controller('admin-dashboard',function ($scope, AuthService, UserFactory, OrderFactory, $state, ProductsFactory, CategoryFactory) {
  $scope.isAdmin = AuthService.isAuthenticated && AuthService.isAdmin;
  if (!$scope.isAdmin){
    console.log("Git out!")
    $state.go('home')};

  $scope.showAll = function(elem){
    console.log($scope[elem]);
    $scope[elem].numToShow = $scope[elem].length;
  }

  ProductsFactory.fetchAll()
  .then(function(returnedProds){
    $scope.products = returnedProds;
  })

  CategoryFactory.fetchAll()
  .then(function (returnedCats) {
    $scope.categories = returnedCats;
  })

//order route not working at present
  // OrderFactory.fetchAll()
  // .then(function (returnedOrders) {
  //   $scope.orders = returnedOrders;
  // });

  UserFactory.fetchAll()
  .then(function (returnedUsers) {
    $scope.users = returnedUsers;
  });


});

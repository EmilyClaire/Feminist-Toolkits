app.config(function ($stateProvider) {
  $stateProvider.state('admin-dashboard',{
    url: '/admin/dashboard',
    templateUrl: '/js/admin-dashboard/admin-dashboard.html',
    controller: 'admin-dashboard'
  })

});

app.controller('admin-dashboard',function ($scope, AuthService, UserFactory, OrderFactory, $state, ProductsFactory, CategoryFactory, AdminFactory) {

  $scope.isAdmin = AuthService.isAuthenticated && AuthService.isAdmin;
  if (!$scope.isAdmin){
    console.log("Git out!")
    $state.go('home')};

  $scope.showAll = function(elem){
    $scope[elem].numToShow = $scope[elem].length;
  }

  $scope.adminPromoClicked = false;

  $scope.makeAdmin = function(user){
    AdminFactory.makeAdmin(user)
    .then(function (data) {
      $scope.adminPromoClicked= false;
      UserFactory.fetchAll()
      .then(function (returnedUsers) {
        $scope.users = returnedUsers;
      })
    })
  }

  $scope.togglePromoClick = function(user){
    if ($scope.adminPromoClicked) {
      $scope.adminPromoClicked=false
    }
    else {$scope.adminPromoClicked=user}
  }

  ProductsFactory.fetchAll()
  .then(function(returnedProds){
    $scope.products = returnedProds;
  })

  CategoryFactory.fetchAll()
  .then(function (returnedCats) {
    $scope.categories = returnedCats;
  })

  OrderFactory.fetchAll()
  .then(function (returnedOrders) {
    $scope.orders = returnedOrders;
  });

  UserFactory.fetchAll()
  .then(function (returnedUsers) {
    $scope.users = returnedUsers;
  });


});

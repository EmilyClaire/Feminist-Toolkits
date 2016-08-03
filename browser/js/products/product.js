app.config(function ($stateProvider) {

  $stateProvider.state('product', {
      url: '/products/:productId',
      controller: 'ProductController',
      templateUrl: 'js/products/product.html',
      resolve: {
        theProduct: function (ProductsFactory, $stateParams) {
          return ProductsFactory.fetchById($stateParams.productId);
        }
      }
  });

});

app.controller('ProductController', function ($scope, theProduct, $rootScope,AuthService) {
  AuthService.getLoggedInUser()
  .then(function(user){
      if(!user){return}
      if(user.isAdmin){$scope.isAdmin=true}
  })

  $scope.product = theProduct.product;
  $scope.categories = theProduct.categories;

  $scope.addItem=function(){
    $rootScope.$broadcast('addingItemToCart', $scope.product);
  }

});

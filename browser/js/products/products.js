app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html',
        resolve: {
          allProducts: function (ProductsFactory) {
            return ProductsFactory.fetchAll();
          }
        }
    });

});

app.controller('ProductsController', function ($scope, allProducts) {

    $scope.products = allProducts;

});

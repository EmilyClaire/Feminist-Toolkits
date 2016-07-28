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

app.controller('ProductsController', function ($scope, allProducts) {

    $scope.products = allProducts;

});

app.controller('ProductController', function ($scope, theProduct) {

  $scope.product = theProduct;

});


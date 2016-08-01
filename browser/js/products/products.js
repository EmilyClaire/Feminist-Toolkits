app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html'
    });

    $stateProvider.state('productsByCategory', {
        url: '/products/categories/:categoryId',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html'
    });
});

app.controller('ProductsController', function ($scope, ProductsFactory, CategoryFactory, $state, $stateParams) {

    if ($stateParams.categoryId) {
        ProductsFactory.fetchAll($stateParams.categoryId)
        .then(function (products) {
            $scope.products = products;
        })
    } else {
        ProductsFactory.fetchAll()
        .then(function (products) {
            $scope.products = products;
        })
    }

    CategoryFactory.fetchAll()
    .then(function (categories) {
        $scope.selectedCategory = categories.filter(function (category) {
            return category.id === Number($stateParams.categoryId);
        })[0];
        $scope.categories = categories;
    });

    $scope.onSelectCategory = function () {
        if ($scope.selectedCategory) {
            $state.go('productsByCategory', { categoryId: $scope.selectedCategory.id });
        } else {
            $state.go('products');
        }
    };

});

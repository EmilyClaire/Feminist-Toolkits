app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products/category/:categoryId',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html',
        resolve: {
            products: function (ProductsFactory) {
                return ProductsFactory.fetchAll();
            },
            categories: function (CategoryFactory) {
                return CategoryFactory.fetchAll();
            }
        }
    });
});

app.controller('ProductsController', function ($scope, products, categories,$stateParams) {

    $scope.products = products;
    $scope.categories = categories;
    console.log('state params',$stateParams);
    if($stateParams.categoryId){
        $scope.selectedCategory={};
        $scope.selectedCategory.id=$stateParams.categoryId;
    }

    $scope.categoryFilter = function (value) {
        console.log('filtering');
        if ($scope.selectedCategory) {
            console.log('here i am')
            return value.categories.some(function (cat) {
                console.log('in callback')
                return cat.id === $scope.selectedCategory.id;
            });
        } else {
            return true;
        }
    }


});

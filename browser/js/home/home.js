app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeController'
    });
});


app.controller('HomeController', function ($scope, ProductsFactory) {

    ProductsFactory.fetchAll()
    .then(function (products) {
        $scope.topProducts = [products[1], products[4], products[7]];
    })


});

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, ProductsFactory) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function (scope, element, atts) {
            angular.extend(scope, ProductsFactory);

            scope.items = [
               { label: 'Home', state: 'home' },
               { label: 'About', state: 'about' },
               { label: 'Products', state: 'products' },
               { label: 'My Account', state: 'account', auth: true }
            ];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                   $state.go('home');
                });
            };

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function () {
                scope.user = null;
            };

            setUser();

            scope.fetchAll()
            .then(function (products) {
                scope.allProducts = products;
            })

            element.bind('keyup', function () {
                for(var i = 0; i < scope.allProducts.length; i++) {
                    if (scope.allProducts[i].id === Number(scope.desiredProduct.id)) {
                        $state.go('product', { productId: scope.desiredProduct.id });
                    }
                }
            })

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

        }

    };

});



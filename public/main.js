'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('about', {
        url: '/about',
        controller: 'AboutController',
        templateUrl: 'js/about/about.html'
    });
});

app.controller('AboutController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);
});
app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout/:items/:number/:total',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });
});

app.controller('CheckoutController', function ($scope, $rootScope, $stateParams) {
    $scope.items = JSON.parse($stateParams.items);
    $scope.items.number = $stateParams.number;
    $scope.items.total = $stateParams.total;
    $scope.$on('$stateChangeStart', function (event, next, current) {
        $rootScope.$broadcast('backToShopping');
    });
    $scope.submitOrder = function (shippingAddress, name, email) {
        console.log(shippingAddress, name, email);
        /*NEEDS TO BE CONNECTED WITH ROUTES*/
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/docs/docs.html'
    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        //Uses the session factory to see if the user is an admin
        this.isAdmin = function () {
            return Session.user.isAdmin;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeController'
    });
});

app.controller('HomeController', function ($scope, ProductsFactory) {

    ProductsFactory.fetchAll().then(function (products) {
        $scope.topProducts = [products[1], products[4], products[7]];
    });
});

app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('product', {
        url: '/products/:productId',
        controller: 'ProductController',
        templateUrl: 'js/products/product.html',
        resolve: {
            theProduct: function theProduct(ProductsFactory, $stateParams) {
                return ProductsFactory.fetchById($stateParams.productId);
            }
        }
    });
});

app.controller('ProductController', function ($scope, theProduct, $rootScope) {

    $scope.product = theProduct.product;
    $scope.categories = theProduct.categories;

    $scope.addItem = function () {
        $rootScope.$broadcast('addingItemToCart', theProduct.product);
    };
});

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
        ProductsFactory.fetchAll($stateParams.categoryId).then(function (products) {
            $scope.products = products;
        });
    } else {
        ProductsFactory.fetchAll().then(function (products) {
            $scope.products = products;
        });
    }

    CategoryFactory.fetchAll().then(function (categories) {
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

app.config(function ($stateProvider) {

    $stateProvider.state('reviews', {
        url: '/products/:productId/reviews',
        controller: 'ReviewsController',
        templateUrl: '/js/reviews/reviews.html',
        resolve: {
            reviews: function reviews(ReviewsFactory, $stateParams) {
                return ReviewsFactory.fetchAll($stateParams.productId);
            }
        }
    });
});

app.controller('ReviewsController', function ($scope, reviews) {

    $scope.reviews = reviews;
});

app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

'use strict';

app.factory('CategoryFactory', function ($http) {

    var CategoryFactory = {};

    function getData(response) {
        return response.data;
    }

    CategoryFactory.fetchAll = function () {
        return $http.get('/api/categories').then(getData);
    };

    return CategoryFactory;
});

'use strict';

app.factory('ProductsFactory', function ($http) {

    var ProductsFactory = {};

    function getData(response) {
        return response.data;
    }

    ProductsFactory.fetchAll = function (categoryId) {

        var queryParams = {};

        if (categoryId) {
            queryParams.categoryId = categoryId;
        }

        return $http.get('/api/products', {
            params: queryParams
        }).then(getData);
    };

    ProductsFactory.fetchById = function (id) {
        return $http.get('/api/products/' + id).then(getData);
    };

    ProductsFactory.create = function (data) {
        return $http.post('/products', data).then(getData).then(function (newProduct) {
            var product = newProduct;
            return product;
        });
    };

    return ProductsFactory;
});

'use strict';

app.factory('ReviewsFactory', function ($http) {

    var ReviewsFactory = {};

    function getData(response) {
        return response.data;
    }

    ReviewsFactory.fetchAll = function (productId) {
        return $http.get('/api/products/' + productId + '/reviews').then(getData);
    };

    return ReviewsFactory;
});

app.directive('cart', function ($state) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/cart/cart.html',
        link: function link(scope) {
            scope.checkingOut = false;
            scope.items = [];
            scope.items.total = 0;
            scope.items.number = 0;
            scope.expandCart = true;
            scope.scoldingMessages = ["You're not gonna fight the patriarchy like that, now are you?", "You may not need men, but you do need tools.", "A woman without a man is like a fish without a bicycle, but fish definitely need tools to fight the patriarchy.", "We know you hate capitalism, but every feminist needs her toolkit."];
            scope.scoldingMessage = scope.scoldingMessages[Math.floor(Math.random() * scope.scoldingMessages.length)];

            scope.addToCart = function (item) {
                var indexOfItem = scope.items.indexOf(item);
                if (indexOfItem == -1) {
                    item.quantity = 1;
                    scope.items.push(item);
                } else {
                    scope.items[indexOfItem].quantity++;
                }
                scope.items.total += item.currentPrice;
                scope.items.number++;
            };
            scope.$on('addingItemToCart', function (event, data) {
                scope.addToCart(data);
            });
            scope.$on('backToShopping', function () {
                scope.checkingOut = false;
            });
            scope.removeFromCart = function (itemToRemove, quantity) {
                for (var i = 0; i < scope.items.length; i++) {
                    if (scope.items[i].id === itemToRemove.id) {
                        if (quantity === 'all' || scope.items[i].quantity === 1) {
                            scope.items.total -= scope.items[i].currentPrice * scope.items[i].quantity;
                            scope.items.splice(i, 1);
                            scope.items.number = 0;
                        } else if (quantity === 'one') {
                            scope.items.total -= scope.items[i].currentPrice;
                            scope.items[i].quantity--;
                            scope.items.number--;
                        }
                        break;
                    }
                }
            };
            scope.cartIsEmpty = function () {
                return scope.items.length === 0;
            };
            scope.toggleExpand = function () {
                scope.expandCart = !scope.expandCart;
            };
            scope.toggleCheckout = function () {
                var serialized = JSON.stringify(scope.items);
                console.log(scope.items);
                $state.go('checkout', { items: serialized, number: scope.items.number, total: scope.items.total });
                scope.checkingOut = true;
            };
        }
    };
});
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Products', state: 'products' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3RzL3Byb2R1Y3QuanMiLCJwcm9kdWN0cy9wcm9kdWN0cy5qcyIsInJldmlld3MvcmV2aWV3cy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9jYXRlZ29yeS1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wcm9kdWN0cy1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9yZXZpZXdzLWZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9jYXJ0L2NhcnQuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUNBLHNCQUFBLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQSx1QkFBQSxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUE7QUFDQSxRQUFBLCtCQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxLQUZBOztBQUlBO0FBQ0E7QUFDQSxlQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDZCQUFBLE9BQUEsQ0FBQSxFQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBQSxZQUFBLGVBQUEsRUFBQSxFQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxjQUFBLGNBQUE7O0FBRUEsb0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxRQUFBLElBQUEsRUFBQSxRQUFBO0FBQ0EsYUFGQSxNQUVBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE9BQUE7QUFDQTtBQUNBLFNBVEE7QUFXQSxLQTVCQTtBQThCQSxDQXZDQTs7QUNmQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxhQUFBLFFBREE7QUFFQSxvQkFBQSxpQkFGQTtBQUdBLHFCQUFBO0FBSEEsS0FBQTtBQU1BLENBVEE7O0FBV0EsSUFBQSxVQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUE7O0FBRUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxFQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUE7QUFFQSxDQUxBO0FDWEEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsYUFBQSxpQ0FEQTtBQUVBLG9CQUFBLG9CQUZBO0FBR0EscUJBQUE7QUFIQSxLQUFBO0FBTUEsQ0FQQTs7QUFTQSxJQUFBLFVBQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxXQUFBLEtBQUEsR0FBQSxLQUFBLEtBQUEsQ0FBQSxhQUFBLEtBQUEsQ0FBQTtBQUNBLFdBQUEsS0FBQSxDQUFBLE1BQUEsR0FBQSxhQUFBLE1BQUE7QUFDQSxXQUFBLEtBQUEsQ0FBQSxLQUFBLEdBQUEsYUFBQSxLQUFBO0FBQ0EsV0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsbUJBQUEsVUFBQSxDQUFBLGdCQUFBO0FBQ0EsS0FGQTtBQUdBLFdBQUEsV0FBQSxHQUFBLFVBQUEsZUFBQSxFQUFBLElBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsRUFBQSxLQUFBO0FBQ0E7QUFDQSxLQUhBO0FBSUEsQ0FYQTtBQ1RBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsT0FEQTtBQUVBLHFCQUFBO0FBRkEsS0FBQTtBQUlBLENBTEE7O0FDQUEsQ0FBQSxZQUFBOztBQUVBOztBQUVBOztBQUNBLFFBQUEsQ0FBQSxPQUFBLE9BQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHdCQUFBLENBQUE7O0FBRUEsUUFBQSxNQUFBLFFBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLENBQUE7O0FBRUEsUUFBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFlBQUE7QUFDQSxZQUFBLENBQUEsT0FBQSxFQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSxzQkFBQSxDQUFBO0FBQ0EsZUFBQSxPQUFBLEVBQUEsQ0FBQSxPQUFBLFFBQUEsQ0FB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QUFBOztBQUVBLGFBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsU0FBQSxJQUFBO0FBQ0E7O0FBRUEsb0JBQUEsUUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLFlBQUEsY0FBQSxFQUFBOztBQUVBLFlBQUEsVUFBQSxFQUFBO0FBQ0Esd0JBQUEsVUFBQSxHQUFBLFVBQUE7QUFDQTs7QUFFQSxlQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBLG9CQUFBO0FBREEsU0FBQSxFQUdBLElBSEEsQ0FHQSxPQUhBLENBQUE7QUFJQSxLQVpBOztBQWNBLG9CQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxPQURBLENBQUE7QUFFQSxLQUhBOztBQUtBLG9CQUFBLE1BQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBLENBQUEsV0FBQSxFQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsT0FEQSxFQUVBLElBRkEsQ0FFQSxVQUFBLFVBQUEsRUFBQTtBQUNBLGdCQUFBLFVBQUEsVUFBQTtBQUNBLG1CQUFBLE9BQUE7QUFDQSxTQUxBLENBQUE7QUFNQSxLQVBBOztBQVNBLFdBQUEsZUFBQTtBQUVBLENBdENBOztBQ0ZBOztBQUVBLElBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxpQkFBQSxFQUFBOztBQUVBLGFBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsU0FBQSxJQUFBO0FBQ0E7O0FBRUEsbUJBQUEsUUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsZUFBQSxNQUFBLEdBQUEsQ0FBQSxtQkFBQSxTQUFBLEdBQUEsVUFBQSxFQUNBLElBREEsQ0FDQSxPQURBLENBQUE7QUFFQSxLQUhBOztBQUtBLFdBQUEsY0FBQTtBQUVBLENBZkE7O0FDRkEsSUFBQSxTQUFBLENBQUEsTUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGtCQUFBLEdBREE7QUFFQSxlQUFBLEVBRkE7QUFHQSxxQkFBQSxxQ0FIQTtBQUlBLGNBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxXQUFBLEdBQUEsS0FBQTtBQUNBLGtCQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsS0FBQSxDQUFBLEtBQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsS0FBQSxDQUFBLE1BQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsVUFBQSxHQUFBLElBQUE7QUFDQSxrQkFBQSxnQkFBQSxHQUFBLENBQUEsK0RBQUEsRUFBQSw4Q0FBQSxFQUFBLGlIQUFBLEVBQUEsb0VBQUEsQ0FBQTtBQUNBLGtCQUFBLGVBQUEsR0FBQSxNQUFBLGdCQUFBLENBQUEsS0FBQSxLQUFBLENBQUEsS0FBQSxNQUFBLEtBQUEsTUFBQSxnQkFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLFNBQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG9CQUFBLGNBQUEsTUFBQSxLQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLG9CQUFBLGVBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSx5QkFBQSxRQUFBLEdBQUEsQ0FBQTtBQUNBLDBCQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsSUFBQTtBQUNBLGlCQUhBLE1BSUE7QUFDQSwwQkFBQSxLQUFBLENBQUEsV0FBQSxFQUFBLFFBQUE7QUFDQTtBQUNBLHNCQUFBLEtBQUEsQ0FBQSxLQUFBLElBQUEsS0FBQSxZQUFBO0FBQ0Esc0JBQUEsS0FBQSxDQUFBLE1BQUE7QUFDQSxhQVhBO0FBWUEsa0JBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsU0FBQSxDQUFBLElBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsR0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLHNCQUFBLFdBQUEsR0FBQSxLQUFBO0FBQ0EsYUFGQTtBQUdBLGtCQUFBLGNBQUEsR0FBQSxVQUFBLFlBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLHdCQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxFQUFBLEtBQUEsYUFBQSxFQUFBLEVBQUE7QUFDQSw0QkFBQSxhQUFBLEtBQUEsSUFBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsUUFBQSxLQUFBLENBQUEsRUFBQTtBQUNBLGtDQUFBLEtBQUEsQ0FBQSxLQUFBLElBQUEsTUFBQSxLQUFBLENBQUEsQ0FBQSxFQUFBLFlBQUEsR0FBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsUUFBQTtBQUNBLGtDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxrQ0FBQSxLQUFBLENBQUEsTUFBQSxHQUFBLENBQUE7QUFDQSx5QkFKQSxNQUtBLElBQUEsYUFBQSxLQUFBLEVBQUE7QUFDQSxrQ0FBQSxLQUFBLENBQUEsS0FBQSxJQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxZQUFBO0FBQ0Esa0NBQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0Esa0NBQUEsS0FBQSxDQUFBLE1BQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBaEJBO0FBaUJBLGtCQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxLQUFBLENBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxzQkFBQSxVQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsY0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxhQUFBLEtBQUEsU0FBQSxDQUFBLE1BQUEsS0FBQSxDQUFBO0FBQ0Esd0JBQUEsR0FBQSxDQUFBLE1BQUEsS0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxPQUFBLFVBQUEsRUFBQSxRQUFBLE1BQUEsS0FBQSxDQUFBLE1BQUEsRUFBQSxPQUFBLE1BQUEsS0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLHNCQUFBLFdBQUEsR0FBQSxJQUFBO0FBQ0EsYUFMQTtBQU1BO0FBNURBLEtBQUE7QUErREEsQ0FoRUE7QUNBQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTtBQ0FBLElBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLHlDQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxrQkFBQSxLQUFBLEdBQUEsQ0FDQSxFQUFBLE9BQUEsTUFBQSxFQUFBLE9BQUEsTUFBQSxFQURBLEVBRUEsRUFBQSxPQUFBLE9BQUEsRUFBQSxPQUFBLE9BQUEsRUFGQSxFQUdBLEVBQUEsT0FBQSxVQUFBLEVBQUEsT0FBQSxVQUFBLEVBSEEsRUFJQSxFQUFBLE9BQUEsY0FBQSxFQUFBLE9BQUEsYUFBQSxFQUFBLE1BQUEsSUFBQSxFQUpBLENBQUE7O0FBT0Esa0JBQUEsSUFBQSxHQUFBLElBQUE7O0FBRUEsa0JBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxZQUFBLGVBQUEsRUFBQTtBQUNBLGFBRkE7O0FBSUEsa0JBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSw0QkFBQSxNQUFBLEdBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSwyQkFBQSxFQUFBLENBQUEsTUFBQTtBQUNBLGlCQUZBO0FBR0EsYUFKQTs7QUFNQSxnQkFBQSxVQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsNEJBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLDBCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUE7O0FBRUEsdUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBekNBLEtBQUE7QUE2Q0EsQ0EvQ0E7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseURBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoZWNrb3V0Jywge1xuICAgICAgICB1cmw6ICcvY2hlY2tvdXQvOml0ZW1zLzpudW1iZXIvOnRvdGFsJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NoZWNrb3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCRyb290U2NvcGUsJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5pdGVtcz1KU09OLnBhcnNlKCRzdGF0ZVBhcmFtcy5pdGVtcyk7XG5cdCRzY29wZS5pdGVtcy5udW1iZXI9JHN0YXRlUGFyYW1zLm51bWJlcjtcblx0JHNjb3BlLml0ZW1zLnRvdGFsPSRzdGF0ZVBhcmFtcy50b3RhbDtcblx0JHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIG5leHQsIGN1cnJlbnQpIHtcblx0ICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnYmFja1RvU2hvcHBpbmcnKTtcblx0fSk7XG5cdCRzY29wZS5zdWJtaXRPcmRlcj1mdW5jdGlvbihzaGlwcGluZ0FkZHJlc3MsbmFtZSxlbWFpbCl7XG5cdFx0Y29uc29sZS5sb2coc2hpcHBpbmdBZGRyZXNzLG5hbWUsZW1haWwpO1xuXHRcdC8qTkVFRFMgVE8gQkUgQ09OTkVDVEVEIFdJVEggUk9VVEVTKi9cblx0fVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICAvL1VzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgdGhlIHVzZXIgaXMgYW4gYWRtaW5cbiAgICAgICAgdGhpcy5pc0FkbWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNlc3Npb24udXNlci5pc0FkbWluO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9kdWN0c0ZhY3RvcnkpIHtcblxuICAgIFByb2R1Y3RzRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHByb2R1Y3RzKSB7XG4gICAgICAgICRzY29wZS50b3BQcm9kdWN0cyA9IFtwcm9kdWN0c1sxXSwgcHJvZHVjdHNbNF0sIHByb2R1Y3RzWzddXTtcbiAgICB9KVxuXG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdCcsIHtcbiAgICAgIHVybDogJy9wcm9kdWN0cy86cHJvZHVjdElkJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3QuaHRtbCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHRoZVByb2R1Y3Q6IGZ1bmN0aW9uIChQcm9kdWN0c0ZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICAgIHJldHVybiBQcm9kdWN0c0ZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgdGhlUHJvZHVjdCwgJHJvb3RTY29wZSkge1xuXG4gICRzY29wZS5wcm9kdWN0ID0gdGhlUHJvZHVjdC5wcm9kdWN0O1xuICAkc2NvcGUuY2F0ZWdvcmllcyA9IHRoZVByb2R1Y3QuY2F0ZWdvcmllcztcblxuICAkc2NvcGUuYWRkSXRlbT1mdW5jdGlvbigpe1xuICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnYWRkaW5nSXRlbVRvQ2FydCcsdGhlUHJvZHVjdC5wcm9kdWN0KTtcbiAgfVxuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdHMnLCB7XG4gICAgICAgIHVybDogJy9wcm9kdWN0cycsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3RzLmh0bWwnXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdHNCeUNhdGVnb3J5Jywge1xuICAgICAgICB1cmw6ICcvcHJvZHVjdHMvY2F0ZWdvcmllcy86Y2F0ZWdvcnlJZCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3RzL3Byb2R1Y3RzLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2R1Y3RzRmFjdG9yeSwgQ2F0ZWdvcnlGYWN0b3J5LCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xuXG4gICAgaWYgKCRzdGF0ZVBhcmFtcy5jYXRlZ29yeUlkKSB7XG4gICAgICAgIFByb2R1Y3RzRmFjdG9yeS5mZXRjaEFsbCgkc3RhdGVQYXJhbXMuY2F0ZWdvcnlJZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHByb2R1Y3RzKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJvZHVjdHMgPSBwcm9kdWN0cztcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBQcm9kdWN0c0ZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocHJvZHVjdHMpIHtcbiAgICAgICAgICAgICRzY29wZS5wcm9kdWN0cyA9IHByb2R1Y3RzO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIENhdGVnb3J5RmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKGNhdGVnb3JpZXMpIHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkQ2F0ZWdvcnkgPSBjYXRlZ29yaWVzLmZpbHRlcihmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBjYXRlZ29yeS5pZCA9PT0gTnVtYmVyKCRzdGF0ZVBhcmFtcy5jYXRlZ29yeUlkKTtcbiAgICAgICAgfSlbMF07XG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gY2F0ZWdvcmllcztcbiAgICB9KTtcblxuICAgICRzY29wZS5vblNlbGVjdENhdGVnb3J5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkQ2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygncHJvZHVjdHNCeUNhdGVnb3J5JywgeyBjYXRlZ29yeUlkOiAkc2NvcGUuc2VsZWN0ZWRDYXRlZ29yeS5pZCB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygncHJvZHVjdHMnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncmV2aWV3cycsIHtcbiAgICAgIHVybDogJy9wcm9kdWN0cy86cHJvZHVjdElkL3Jldmlld3MnLFxuICAgICAgY29udHJvbGxlcjogJ1Jldmlld3NDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnL2pzL3Jldmlld3MvcmV2aWV3cy5odG1sJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgcmV2aWV3czogZnVuY3Rpb24gKFJldmlld3NGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgICByZXR1cm4gUmV2aWV3c0ZhY3RvcnkuZmV0Y2hBbGwoJHN0YXRlUGFyYW1zLnByb2R1Y3RJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignUmV2aWV3c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCByZXZpZXdzKSB7XG5cbiAgJHNjb3BlLnJldmlld3MgPSByZXZpZXdzO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdDYXRlZ29yeUZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICB2YXIgQ2F0ZWdvcnlGYWN0b3J5ID0ge307XG5cbiAgZnVuY3Rpb24gZ2V0RGF0YSAocmVzcG9uc2UpIHtcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgfVxuXG4gIENhdGVnb3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2NhdGVnb3JpZXMnKVxuICAgIC50aGVuKGdldERhdGEpO1xuICB9O1xuXG4gIHJldHVybiBDYXRlZ29yeUZhY3Rvcnk7XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUHJvZHVjdHNGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgdmFyIFByb2R1Y3RzRmFjdG9yeSA9IHt9O1xuXG4gIGZ1bmN0aW9uIGdldERhdGEgKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gIH1cblxuICBQcm9kdWN0c0ZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoY2F0ZWdvcnlJZCkge1xuXG4gICAgdmFyIHF1ZXJ5UGFyYW1zID0ge307XG5cbiAgICBpZiAoY2F0ZWdvcnlJZCkge1xuICAgICAgcXVlcnlQYXJhbXMuY2F0ZWdvcnlJZCA9IGNhdGVnb3J5SWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cycsIHtcbiAgICAgIHBhcmFtczogcXVlcnlQYXJhbXNcbiAgICB9KVxuICAgIC50aGVuKGdldERhdGEpO1xuICB9O1xuXG4gIFByb2R1Y3RzRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzLycgKyBpZClcbiAgICAudGhlbihnZXREYXRhKTtcbiAgfTtcblxuICBQcm9kdWN0c0ZhY3RvcnkuY3JlYXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvcHJvZHVjdHMnLCBkYXRhKVxuICAgICAgLnRoZW4oZ2V0RGF0YSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChuZXdQcm9kdWN0KSB7XG4gICAgICAgIHZhciBwcm9kdWN0ID0gbmV3UHJvZHVjdDtcbiAgICAgICAgcmV0dXJuIHByb2R1Y3Q7XG4gICAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gUHJvZHVjdHNGYWN0b3J5O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1Jldmlld3NGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgdmFyIFJldmlld3NGYWN0b3J5ID0ge307XG5cbiAgZnVuY3Rpb24gZ2V0RGF0YSAocmVzcG9uc2UpIHtcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgfVxuXG4gIFJldmlld3NGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKHByb2R1Y3RJZCkge1xuICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMvJyArIHByb2R1Y3RJZCArICcvcmV2aWV3cycpXG4gICAgLnRoZW4oZ2V0RGF0YSk7XG4gIH07XG5cbiAgcmV0dXJuIFJldmlld3NGYWN0b3J5O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2NhcnQnLCBmdW5jdGlvbiAoJHN0YXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2NhcnQvY2FydC5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5jaGVja2luZ091dD1mYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLml0ZW1zPVtdO1xuICAgICAgICBcdHNjb3BlLml0ZW1zLnRvdGFsPTA7XG4gICAgICAgICAgICBzY29wZS5pdGVtcy5udW1iZXI9MDtcbiAgICAgICAgICAgIHNjb3BlLmV4cGFuZENhcnQ9dHJ1ZTtcbiAgICAgICAgICAgIHNjb3BlLnNjb2xkaW5nTWVzc2FnZXM9W1wiWW91J3JlIG5vdCBnb25uYSBmaWdodCB0aGUgcGF0cmlhcmNoeSBsaWtlIHRoYXQsIG5vdyBhcmUgeW91P1wiLFwiWW91IG1heSBub3QgbmVlZCBtZW4sIGJ1dCB5b3UgZG8gbmVlZCB0b29scy5cIixcIkEgd29tYW4gd2l0aG91dCBhIG1hbiBpcyBsaWtlIGEgZmlzaCB3aXRob3V0IGEgYmljeWNsZSwgYnV0IGZpc2ggZGVmaW5pdGVseSBuZWVkIHRvb2xzIHRvIGZpZ2h0IHRoZSBwYXRyaWFyY2h5LlwiLFwiV2Uga25vdyB5b3UgaGF0ZSBjYXBpdGFsaXNtLCBidXQgZXZlcnkgZmVtaW5pc3QgbmVlZHMgaGVyIHRvb2xraXQuXCJdO1xuICAgICAgICAgICAgc2NvcGUuc2NvbGRpbmdNZXNzYWdlPXNjb3BlLnNjb2xkaW5nTWVzc2FnZXNbKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNjb3BlLnNjb2xkaW5nTWVzc2FnZXMubGVuZ3RoKSldO1xuXG4gICAgICAgICAgICBzY29wZS5hZGRUb0NhcnQ9ZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4T2ZJdGVtPXNjb3BlLml0ZW1zLmluZGV4T2YoaXRlbSk7XG4gICAgICAgICAgICAgICAgaWYoaW5kZXhPZkl0ZW09PS0xKXtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5xdWFudGl0eT0xO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5pdGVtc1tpbmRleE9mSXRlbV0ucXVhbnRpdHkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMudG90YWwrPWl0ZW0uY3VycmVudFByaWNlO1xuICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zLm51bWJlcisrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUuJG9uKCdhZGRpbmdJdGVtVG9DYXJ0JyxmdW5jdGlvbihldmVudCxkYXRhKXtcbiAgICAgICAgICAgICAgICBzY29wZS5hZGRUb0NhcnQoZGF0YSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgc2NvcGUuJG9uKCdiYWNrVG9TaG9wcGluZycsZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzY29wZS5jaGVja2luZ091dD1mYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2NvcGUucmVtb3ZlRnJvbUNhcnQ9ZnVuY3Rpb24oaXRlbVRvUmVtb3ZlLHF1YW50aXR5KXtcbiAgICAgICAgICAgIFx0Zm9yICh2YXIgaT0wOyBpPHNjb3BlLml0ZW1zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIFx0XHRpZihzY29wZS5pdGVtc1tpXS5pZD09PWl0ZW1Ub1JlbW92ZS5pZCl7XG4gICAgICAgICAgICBcdFx0XHRpZihxdWFudGl0eT09PSdhbGwnfHxzY29wZS5pdGVtc1tpXS5xdWFudGl0eT09PTEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zLnRvdGFsLT0oc2NvcGUuaXRlbXNbaV0uY3VycmVudFByaWNlKnNjb3BlLml0ZW1zW2ldLnF1YW50aXR5KTtcbiAgICAgICAgICAgIFx0XHRcdFx0c2NvcGUuaXRlbXMuc3BsaWNlKGksMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMubnVtYmVyPTA7XG4gICAgICAgICAgICBcdFx0XHR9XG4gICAgICAgICAgICBcdFx0XHRlbHNlIGlmKHF1YW50aXR5PT09J29uZScpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zLnRvdGFsLT1zY29wZS5pdGVtc1tpXS5jdXJyZW50UHJpY2U7XG4gICAgICAgICAgICBcdFx0XHRcdHNjb3BlLml0ZW1zW2ldLnF1YW50aXR5LS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMubnVtYmVyLS07XG4gICAgICAgICAgICBcdFx0XHR9XG4gICAgICAgICAgICBcdFx0XHRicmVhaztcbiAgICAgICAgICAgIFx0XHR9XG4gICAgICAgICAgICBcdH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjb3BlLmNhcnRJc0VtcHR5PWZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcdHJldHVybiBzY29wZS5pdGVtcy5sZW5ndGg9PT0wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUudG9nZ2xlRXhwYW5kPWZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2NvcGUuZXhwYW5kQ2FydD0hc2NvcGUuZXhwYW5kQ2FydDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjb3BlLnRvZ2dsZUNoZWNrb3V0PWZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWQ9SlNPTi5zdHJpbmdpZnkoc2NvcGUuaXRlbXMpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNjb3BlLml0ZW1zKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NoZWNrb3V0Jyx7aXRlbXM6IHNlcmlhbGl6ZWQsbnVtYmVyOnNjb3BlLml0ZW1zLm51bWJlcix0b3RhbDpzY29wZS5pdGVtcy50b3RhbH0pO1xuICAgICAgICAgICAgICAgIHNjb3BlLmNoZWNraW5nT3V0PXRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1Byb2R1Y3RzJywgc3RhdGU6ICdwcm9kdWN0cycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

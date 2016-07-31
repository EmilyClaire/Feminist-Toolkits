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

app.controller('CheckoutController', function ($scope, $rootScope, $stateParams, OrdersFactory) {
    $scope.items = JSON.parse($stateParams.items);
    $scope.items.number = $stateParams.number;
    $scope.items.total = $stateParams.total;
    $scope.items.ids = $scope.items.map(function (item) {
        return item.id;
    });
    console.log($scope.items.ids);
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
        templateUrl: 'js/home/home.html'
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
        $state.go('productsByCategory', { categoryId: $scope.selectedCategory.id });
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
    console.log('THIS IS SCOPE.REVIEWS ', $scope.reviews);
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

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
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
                $state.go('checkout', { items: serialized, number: scope.items.number, total: scope.items.total });
                scope.checkingOut = true;
            };
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3RzL3Byb2R1Y3QuanMiLCJwcm9kdWN0cy9wcm9kdWN0cy5qcyIsInJldmlld3MvcmV2aWV3cy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9jYXRlZ29yeS1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wcm9kdWN0cy1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9yZXZpZXdzLWZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2NhcnQvY2FydC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUNBLHNCQUFBLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQSx1QkFBQSxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUE7QUFDQSxRQUFBLCtCQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxLQUZBOztBQUlBO0FBQ0E7QUFDQSxlQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDZCQUFBLE9BQUEsQ0FBQSxFQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsWUFBQSxZQUFBLGVBQUEsRUFBQSxFQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxjQUFBLGNBQUE7O0FBRUEsb0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxRQUFBLElBQUEsRUFBQSxRQUFBO0FBQ0EsYUFGQSxNQUVBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE9BQUE7QUFDQTtBQUNBLFNBVEE7QUFXQSxLQTVCQTtBQThCQSxDQXZDQTs7QUNmQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxhQUFBLFFBREE7QUFFQSxvQkFBQSxpQkFGQTtBQUdBLHFCQUFBO0FBSEEsS0FBQTtBQU1BLENBVEE7O0FBV0EsSUFBQSxVQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUE7O0FBRUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxFQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUE7QUFFQSxDQUxBO0FDWEEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsYUFBQSxpQ0FEQTtBQUVBLG9CQUFBLG9CQUZBO0FBR0EscUJBQUE7QUFIQSxLQUFBO0FBTUEsQ0FQQTs7QUFTQSxJQUFBLFVBQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEdBQUEsS0FBQSxLQUFBLENBQUEsYUFBQSxLQUFBLENBQUE7QUFDQSxXQUFBLEtBQUEsQ0FBQSxNQUFBLEdBQUEsYUFBQSxNQUFBO0FBQ0EsV0FBQSxLQUFBLENBQUEsS0FBQSxHQUFBLGFBQUEsS0FBQTtBQUNBLFdBQUEsS0FBQSxDQUFBLEdBQUEsR0FBQSxPQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsRUFBQTtBQUNBLEtBRkEsQ0FBQTtBQUdBLFlBQUEsR0FBQSxDQUFBLE9BQUEsS0FBQSxDQUFBLEdBQUE7QUFDQSxXQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLENBQUEsZ0JBQUE7QUFDQSxLQUZBO0FBR0EsV0FBQSxXQUFBLEdBQUEsVUFBQSxlQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUE7QUFDQTtBQUNBLEtBSEE7QUFJQSxDQWZBO0FDVEEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxPQURBO0FBRUEscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTs7QUNBQSxDQUFBLFlBQUE7O0FBRUE7O0FBRUE7O0FBQ0EsUUFBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQTs7QUFFQSxRQUFBLE1BQUEsUUFBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQTs7QUFFQSxRQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHNCQUFBLENBQUE7QUFDQSxlQUFBLE9BQUEsRUFBQSxDQUFBLE9BQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLEtBSEE7O0FBS0E7QUFDQTtBQUNBO0FBQ0EsUUFBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esc0JBQUEsb0JBREE7QUFFQSxxQkFBQSxtQkFGQTtBQUdBLHVCQUFBLHFCQUhBO0FBSUEsd0JBQUEsc0JBSkE7QUFLQSwwQkFBQSx3QkFMQTtBQU1BLHVCQUFBO0FBTkEsS0FBQTs7QUFTQSxRQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLGFBQUE7QUFDQSxpQkFBQSxZQUFBLGdCQURBO0FBRUEsaUJBQUEsWUFBQSxhQUZBO0FBR0EsaUJBQUEsWUFBQSxjQUhBO0FBSUEsaUJBQUEsWUFBQTtBQUpBLFNBQUE7QUFNQSxlQUFBO0FBQ0EsMkJBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMkJBQUEsVUFBQSxDQUFBLFdBQUEsU0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0EsdUJBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBO0FBQ0E7QUFKQSxTQUFBO0FBTUEsS0FiQTs7QUFlQSxRQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHNCQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQURBLEVBRUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsU0FKQSxDQUFBO0FBTUEsS0FQQTs7QUFTQSxRQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsT0FBQSxTQUFBLElBQUE7QUFDQSxvQkFBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsdUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsSUFBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLFFBQUEsSUFBQTtBQUNBLFNBRkE7O0FBSUE7QUFDQSxhQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsUUFBQSxJQUFBLENBQUEsT0FBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxnQkFBQSxLQUFBLGVBQUEsTUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsSUFBQSxDQUFBLFFBQUEsSUFBQSxDQUFBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUJBQUEsTUFBQSxHQUFBLENBQUEsVUFBQSxFQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQTtBQUNBLGFBRkEsQ0FBQTtBQUlBLFNBckJBOztBQXVCQSxhQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLE1BQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLEVBQ0EsSUFEQSxDQUNBLGlCQURBLEVBRUEsS0FGQSxDQUVBLFlBQUE7QUFDQSx1QkFBQSxHQUFBLE1BQUEsQ0FBQSxFQUFBLFNBQUEsNEJBQUEsRUFBQSxDQUFBO0FBQ0EsYUFKQSxDQUFBO0FBS0EsU0FOQTs7QUFRQSxhQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsTUFBQSxHQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esd0JBQUEsT0FBQTtBQUNBLDJCQUFBLFVBQUEsQ0FBQSxZQUFBLGFBQUE7QUFDQSxhQUhBLENBQUE7QUFJQSxTQUxBO0FBT0EsS0ExREE7O0FBNERBLFFBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxPQUFBLElBQUE7O0FBRUEsbUJBQUEsR0FBQSxDQUFBLFlBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsaUJBQUEsT0FBQTtBQUNBLFNBRkE7O0FBSUEsbUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxpQkFBQSxPQUFBO0FBQ0EsU0FGQTs7QUFJQSxhQUFBLEVBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxJQUFBLEdBQUEsSUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLEdBQUEsU0FBQTtBQUNBLGlCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FIQTs7QUFLQSxhQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxHQUFBLElBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLFNBSEE7QUFLQSxLQXpCQTtBQTJCQSxDQXpJQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLEdBREE7QUFFQSxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGFBQUEsUUFEQTtBQUVBLHFCQUFBLHFCQUZBO0FBR0Esb0JBQUE7QUFIQSxLQUFBO0FBTUEsQ0FSQTs7QUFVQSxJQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEdBQUEsSUFBQTs7QUFFQSxX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QUFBLFlBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLHdCQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxFQUFBLEtBQUEsYUFBQSxFQUFBLEVBQUE7QUFDQSw0QkFBQSxhQUFBLEtBQUEsSUFBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsUUFBQSxLQUFBLENBQUEsRUFBQTtBQUNBLGtDQUFBLEtBQUEsQ0FBQSxLQUFBLElBQUEsTUFBQSxLQUFBLENBQUEsQ0FBQSxFQUFBLFlBQUEsR0FBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsUUFBQTtBQUNBLGtDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxrQ0FBQSxLQUFBLENBQUEsTUFBQSxHQUFBLENBQUE7QUFDQSx5QkFKQSxNQUtBLElBQUEsYUFBQSxLQUFBLEVBQUE7QUFDQSxrQ0FBQSxLQUFBLENBQUEsS0FBQSxJQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxZQUFBO0FBQ0Esa0NBQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0Esa0NBQUEsS0FBQSxDQUFBLE1BQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBaEJBO0FBaUJBLGtCQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxLQUFBLENBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxzQkFBQSxVQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsY0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxhQUFBLEtBQUEsU0FBQSxDQUFBLE1BQUEsS0FBQSxDQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLFVBQUEsRUFBQSxFQUFBLE9BQUEsVUFBQSxFQUFBLFFBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxFQUFBLE9BQUEsTUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0Esc0JBQUEsV0FBQSxHQUFBLElBQUE7QUFDQSxhQUpBO0FBS0E7QUEzREEsS0FBQTtBQThEQSxDQS9EQTtBQ0FBLElBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLHlDQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxrQkFBQSxLQUFBLEdBQUEsQ0FDQSxFQUFBLE9BQUEsTUFBQSxFQUFBLE9BQUEsTUFBQSxFQURBLEVBRUEsRUFBQSxPQUFBLE9BQUEsRUFBQSxPQUFBLE9BQUEsRUFGQSxFQUdBLEVBQUEsT0FBQSxVQUFBLEVBQUEsT0FBQSxVQUFBLEVBSEEsRUFJQSxFQUFBLE9BQUEsY0FBQSxFQUFBLE9BQUEsYUFBQSxFQUFBLE1BQUEsSUFBQSxFQUpBLENBQUE7O0FBT0Esa0JBQUEsSUFBQSxHQUFBLElBQUE7O0FBRUEsa0JBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxZQUFBLGVBQUEsRUFBQTtBQUNBLGFBRkE7O0FBSUEsa0JBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSw0QkFBQSxNQUFBLEdBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSwyQkFBQSxFQUFBLENBQUEsTUFBQTtBQUNBLGlCQUZBO0FBR0EsYUFKQTs7QUFNQSxnQkFBQSxVQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsNEJBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLDBCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUE7O0FBRUEsdUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBekNBLEtBQUE7QUE2Q0EsQ0EvQ0E7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseURBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoZWNrb3V0Jywge1xuICAgICAgICB1cmw6ICcvY2hlY2tvdXQvOml0ZW1zLzpudW1iZXIvOnRvdGFsJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NoZWNrb3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCRyb290U2NvcGUsJHN0YXRlUGFyYW1zLE9yZGVyc0ZhY3RvcnkpIHtcblx0JHNjb3BlLml0ZW1zPUpTT04ucGFyc2UoJHN0YXRlUGFyYW1zLml0ZW1zKTtcblx0JHNjb3BlLml0ZW1zLm51bWJlcj0kc3RhdGVQYXJhbXMubnVtYmVyO1xuXHQkc2NvcGUuaXRlbXMudG90YWw9JHN0YXRlUGFyYW1zLnRvdGFsO1xuXHQkc2NvcGUuaXRlbXMuaWRzPSRzY29wZS5pdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSl7XG5cdFx0cmV0dXJuIGl0ZW0uaWQ7XG5cdH0pXG5cdGNvbnNvbGUubG9nKCRzY29wZS5pdGVtcy5pZHMpO1xuXHQkc2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgbmV4dCwgY3VycmVudCkge1xuXHQgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdiYWNrVG9TaG9wcGluZycpO1xuXHR9KTtcblx0JHNjb3BlLnN1Ym1pdE9yZGVyPWZ1bmN0aW9uKHNoaXBwaW5nQWRkcmVzcyxuYW1lLGVtYWlsKXtcblx0XHRjb25zb2xlLmxvZyhzaGlwcGluZ0FkZHJlc3MsbmFtZSxlbWFpbCk7XG5cdFx0LypORUVEUyBUTyBCRSBDT05ORUNURUQgV0lUSCBST1VURVMqL1xuXHR9XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiB0aGUgdXNlciBpcyBhbiBhZG1pblxuICAgICAgICB0aGlzLmlzQWRtaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gU2Vzc2lvbi51c2VyLmlzQWRtaW47XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCdcbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3QnLCB7XG4gICAgICB1cmw6ICcvcHJvZHVjdHMvOnByb2R1Y3RJZCcsXG4gICAgICBjb250cm9sbGVyOiAnUHJvZHVjdENvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0cy9wcm9kdWN0Lmh0bWwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICB0aGVQcm9kdWN0OiBmdW5jdGlvbiAoUHJvZHVjdHNGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgICByZXR1cm4gUHJvZHVjdHNGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMucHJvZHVjdElkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHRoZVByb2R1Y3QsICRyb290U2NvcGUpIHtcblxuICAkc2NvcGUucHJvZHVjdCA9IHRoZVByb2R1Y3QucHJvZHVjdDtcbiAgJHNjb3BlLmNhdGVnb3JpZXMgPSB0aGVQcm9kdWN0LmNhdGVnb3JpZXM7XG5cbiAgJHNjb3BlLmFkZEl0ZW09ZnVuY3Rpb24oKXtcbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2FkZGluZ0l0ZW1Ub0NhcnQnLHRoZVByb2R1Y3QucHJvZHVjdCk7XG4gIH1cblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3RzJywge1xuICAgICAgICB1cmw6ICcvcHJvZHVjdHMnLFxuICAgICAgICBjb250cm9sbGVyOiAnUHJvZHVjdHNDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0cy9wcm9kdWN0cy5odG1sJ1xuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3RzQnlDYXRlZ29yeScsIHtcbiAgICAgICAgdXJsOiAnL3Byb2R1Y3RzL2NhdGVnb3JpZXMvOmNhdGVnb3J5SWQnLFxuICAgICAgICBjb250cm9sbGVyOiAnUHJvZHVjdHNDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0cy9wcm9kdWN0cy5odG1sJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9kdWN0c0ZhY3RvcnksIENhdGVnb3J5RmFjdG9yeSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcblxuICAgIGlmICgkc3RhdGVQYXJhbXMuY2F0ZWdvcnlJZCkge1xuICAgICAgICBQcm9kdWN0c0ZhY3RvcnkuZmV0Y2hBbGwoJHN0YXRlUGFyYW1zLmNhdGVnb3J5SWQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChwcm9kdWN0cykge1xuICAgICAgICAgICAgJHNjb3BlLnByb2R1Y3RzID0gcHJvZHVjdHM7XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgUHJvZHVjdHNGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHByb2R1Y3RzKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJvZHVjdHMgPSBwcm9kdWN0cztcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBDYXRlZ29yeUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgIC50aGVuKGZ1bmN0aW9uIChjYXRlZ29yaWVzKSB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZENhdGVnb3J5ID0gY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2F0ZWdvcnkuaWQgPT09IE51bWJlcigkc3RhdGVQYXJhbXMuY2F0ZWdvcnlJZCk7XG4gICAgICAgIH0pWzBdO1xuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9IGNhdGVnb3JpZXM7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUub25TZWxlY3RDYXRlZ29yeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHN0YXRlLmdvKCdwcm9kdWN0c0J5Q2F0ZWdvcnknLCB7IGNhdGVnb3J5SWQ6ICRzY29wZS5zZWxlY3RlZENhdGVnb3J5LmlkIH0pO1xuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncmV2aWV3cycsIHtcbiAgICAgIHVybDogJy9wcm9kdWN0cy86cHJvZHVjdElkL3Jldmlld3MnLFxuICAgICAgY29udHJvbGxlcjogJ1Jldmlld3NDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnL2pzL3Jldmlld3MvcmV2aWV3cy5odG1sJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgcmV2aWV3czogZnVuY3Rpb24gKFJldmlld3NGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgICByZXR1cm4gUmV2aWV3c0ZhY3RvcnkuZmV0Y2hBbGwoJHN0YXRlUGFyYW1zLnByb2R1Y3RJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignUmV2aWV3c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCByZXZpZXdzKSB7XG5cbiAgJHNjb3BlLnJldmlld3MgPSByZXZpZXdzO1xuICBjb25zb2xlLmxvZygnVEhJUyBJUyBTQ09QRS5SRVZJRVdTICcsICRzY29wZS5yZXZpZXdzKTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnQ2F0ZWdvcnlGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgdmFyIENhdGVnb3J5RmFjdG9yeSA9IHt9O1xuXG4gIGZ1bmN0aW9uIGdldERhdGEgKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gIH1cblxuICBDYXRlZ29yeUZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9jYXRlZ29yaWVzJylcbiAgICAudGhlbihnZXREYXRhKTtcbiAgfTtcblxuICByZXR1cm4gQ2F0ZWdvcnlGYWN0b3J5O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1Byb2R1Y3RzRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHZhciBQcm9kdWN0c0ZhY3RvcnkgPSB7fTtcblxuICBmdW5jdGlvbiBnZXREYXRhIChyZXNwb25zZSkge1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICB9XG5cbiAgUHJvZHVjdHNGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKGNhdGVnb3J5SWQpIHtcblxuICAgIHZhciBxdWVyeVBhcmFtcyA9IHt9O1xuXG4gICAgaWYgKGNhdGVnb3J5SWQpIHtcbiAgICAgIHF1ZXJ5UGFyYW1zLmNhdGVnb3J5SWQgPSBjYXRlZ29yeUlkO1xuICAgIH1cblxuICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMnLCB7XG4gICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zXG4gICAgfSlcbiAgICAudGhlbihnZXREYXRhKTtcbiAgfTtcblxuICBQcm9kdWN0c0ZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy8nICsgaWQpXG4gICAgLnRoZW4oZ2V0RGF0YSk7XG4gIH07XG5cbiAgUHJvZHVjdHNGYWN0b3J5LmNyZWF0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL3Byb2R1Y3RzJywgZGF0YSlcbiAgICAgIC50aGVuKGdldERhdGEpXG4gICAgICAudGhlbihmdW5jdGlvbiAobmV3UHJvZHVjdCkge1xuICAgICAgICB2YXIgcHJvZHVjdCA9IG5ld1Byb2R1Y3Q7XG4gICAgICAgIHJldHVybiBwcm9kdWN0O1xuICAgICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIFByb2R1Y3RzRmFjdG9yeTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdSZXZpZXdzRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHZhciBSZXZpZXdzRmFjdG9yeSA9IHt9O1xuXG4gIGZ1bmN0aW9uIGdldERhdGEgKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gIH1cblxuICBSZXZpZXdzRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uIChwcm9kdWN0SWQpIHtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzLycgKyBwcm9kdWN0SWQgKyAnL3Jldmlld3MnKVxuICAgIC50aGVuKGdldERhdGEpO1xuICB9O1xuXG4gIHJldHVybiBSZXZpZXdzRmFjdG9yeTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnY2FydCcsIGZ1bmN0aW9uICgkc3RhdGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvY2FydC9jYXJ0Lmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmNoZWNraW5nT3V0PWZhbHNlO1xuICAgICAgICAgICAgc2NvcGUuaXRlbXM9W107XG4gICAgICAgIFx0c2NvcGUuaXRlbXMudG90YWw9MDtcbiAgICAgICAgICAgIHNjb3BlLml0ZW1zLm51bWJlcj0wO1xuICAgICAgICAgICAgc2NvcGUuZXhwYW5kQ2FydD10cnVlO1xuICAgICAgICAgICAgc2NvcGUuc2NvbGRpbmdNZXNzYWdlcz1bXCJZb3UncmUgbm90IGdvbm5hIGZpZ2h0IHRoZSBwYXRyaWFyY2h5IGxpa2UgdGhhdCwgbm93IGFyZSB5b3U/XCIsXCJZb3UgbWF5IG5vdCBuZWVkIG1lbiwgYnV0IHlvdSBkbyBuZWVkIHRvb2xzLlwiLFwiQSB3b21hbiB3aXRob3V0IGEgbWFuIGlzIGxpa2UgYSBmaXNoIHdpdGhvdXQgYSBiaWN5Y2xlLCBidXQgZmlzaCBkZWZpbml0ZWx5IG5lZWQgdG9vbHMgdG8gZmlnaHQgdGhlIHBhdHJpYXJjaHkuXCIsXCJXZSBrbm93IHlvdSBoYXRlIGNhcGl0YWxpc20sIGJ1dCBldmVyeSBmZW1pbmlzdCBuZWVkcyBoZXIgdG9vbGtpdC5cIl07XG4gICAgICAgICAgICBzY29wZS5zY29sZGluZ01lc3NhZ2U9c2NvcGUuc2NvbGRpbmdNZXNzYWdlc1soTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2NvcGUuc2NvbGRpbmdNZXNzYWdlcy5sZW5ndGgpKV07XG5cbiAgICAgICAgICAgIHNjb3BlLmFkZFRvQ2FydD1mdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXhPZkl0ZW09c2NvcGUuaXRlbXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgICAgICBpZihpbmRleE9mSXRlbT09LTEpe1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnF1YW50aXR5PTE7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zW2luZGV4T2ZJdGVtXS5xdWFudGl0eSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy50b3RhbCs9aXRlbS5jdXJyZW50UHJpY2U7XG4gICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMubnVtYmVyKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY29wZS4kb24oJ2FkZGluZ0l0ZW1Ub0NhcnQnLGZ1bmN0aW9uKGV2ZW50LGRhdGEpe1xuICAgICAgICAgICAgICAgIHNjb3BlLmFkZFRvQ2FydChkYXRhKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBzY29wZS4kb24oJ2JhY2tUb1Nob3BwaW5nJyxmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNjb3BlLmNoZWNraW5nT3V0PWZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzY29wZS5yZW1vdmVGcm9tQ2FydD1mdW5jdGlvbihpdGVtVG9SZW1vdmUscXVhbnRpdHkpe1xuICAgICAgICAgICAgXHRmb3IgKHZhciBpPTA7IGk8c2NvcGUuaXRlbXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgXHRcdGlmKHNjb3BlLml0ZW1zW2ldLmlkPT09aXRlbVRvUmVtb3ZlLmlkKXtcbiAgICAgICAgICAgIFx0XHRcdGlmKHF1YW50aXR5PT09J2FsbCd8fHNjb3BlLml0ZW1zW2ldLnF1YW50aXR5PT09MSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMudG90YWwtPShzY29wZS5pdGVtc1tpXS5jdXJyZW50UHJpY2Uqc2NvcGUuaXRlbXNbaV0ucXVhbnRpdHkpO1xuICAgICAgICAgICAgXHRcdFx0XHRzY29wZS5pdGVtcy5zcGxpY2UoaSwxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy5udW1iZXI9MDtcbiAgICAgICAgICAgIFx0XHRcdH1cbiAgICAgICAgICAgIFx0XHRcdGVsc2UgaWYocXVhbnRpdHk9PT0nb25lJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMudG90YWwtPXNjb3BlLml0ZW1zW2ldLmN1cnJlbnRQcmljZTtcbiAgICAgICAgICAgIFx0XHRcdFx0c2NvcGUuaXRlbXNbaV0ucXVhbnRpdHktLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy5udW1iZXItLTtcbiAgICAgICAgICAgIFx0XHRcdH1cbiAgICAgICAgICAgIFx0XHRcdGJyZWFrO1xuICAgICAgICAgICAgXHRcdH1cbiAgICAgICAgICAgIFx0fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUuY2FydElzRW1wdHk9ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFx0cmV0dXJuIHNjb3BlLml0ZW1zLmxlbmd0aD09PTA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY29wZS50b2dnbGVFeHBhbmQ9ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzY29wZS5leHBhbmRDYXJ0PSFzY29wZS5leHBhbmRDYXJ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUudG9nZ2xlQ2hlY2tvdXQ9ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VyaWFsaXplZD1KU09OLnN0cmluZ2lmeShzY29wZS5pdGVtcyk7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjaGVja291dCcse2l0ZW1zOiBzZXJpYWxpemVkLG51bWJlcjpzY29wZS5pdGVtcy5udW1iZXIsdG90YWw6c2NvcGUuaXRlbXMudG90YWx9KTtcbiAgICAgICAgICAgICAgICBzY29wZS5jaGVja2luZ091dD10cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1Byb2R1Y3RzJywgc3RhdGU6ICdwcm9kdWN0cycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

/* import HomeCtrl */ var HomeCtrl = require('./controllers/HomeCtrl');
/* import home */ var home = require('./../components/home');
/* import myApp */ var myApp = require('./myApp');

myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home', {
        templateUrl: '../components/home.html',
        controller: 'HomeCtrl'
      }).
      otherwise({
        redirectTo: '/home'
      });
  }]);

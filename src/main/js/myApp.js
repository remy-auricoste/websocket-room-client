/* import angular */ var angular = require('angular');
require('angular-route');

'use strict';

/* App Module */
var appName = "myApp";

var myApp = angular.module(appName, [
  'ngRoute'
]);

module.exports = myApp;

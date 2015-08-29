/* import filename */ var filename = 'adder';
/* import directives */ var directives = require('./../js/directives');
/* import Adder */ var Adder = require('./../js/services/Adder');

directives.addTemplate(filename, {
    start: "="
}, function($scope) {
    $scope.counter = $scope.start;
    $scope.add = function() {
        $scope.counter = Adder.add($scope.counter);
    }
});

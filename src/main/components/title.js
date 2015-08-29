/* import filename */ var filename = 'title';
/* import directives */ var directives = require('./../js/directives');

directives.addTemplate(filename, {
    title: "@"
}, function($scope) {
    $scope.subtitle = "mon sous-titre";
});

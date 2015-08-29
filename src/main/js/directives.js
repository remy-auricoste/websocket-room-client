/* import myApp */ var myApp = require('./myApp');
/* import AngularInjects */ var AngularInjects = require('./AngularInjects');

'use strict';

var firstCapital = function(string) {
    return string.substring(0, 1).toUpperCase() + string.substring(1);
}

var object = {
    addTemplate: function(name, params, linkFct) {
        var directiveName = "d"+firstCapital(name);
        myApp.directive(directiveName, ['$document', '$timeout', function($document, $timeout) {
            if (!AngularInjects.$document) {
                AngularInjects.$document = $document;
            }
            if (!AngularInjects.$timeout) {
                AngularInjects.$timeout = $timeout;
            }
            var result = {
                scope: params,
                templateUrl: "../components/"+name+".html",
                transclude: params.transclude === true
            };
            if (params.transclude) {
                delete params.transclude;
            }
            if (linkFct) {
                result.link = function(a,b,c,d) {
                    var el = b[0];
                    angular.element(el).addClass(name);
                    return linkFct(a,b,c,d);
                };
            }
            return result;
        }]);
    }
}


module.exports = object;

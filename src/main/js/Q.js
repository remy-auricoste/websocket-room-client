var Q = require("q");

Q.empty = function() {
    return Q.fcall(function() {});
};
Q.traverse = function(array, promiseFactory) {
    var promise = Q.empty();
    var result = [];
    array.forEach(function(item) {
        promise = promise.then(function(itemRes) {
            result.push(itemRes);
            return promiseFactory(item);
        });
    });
    return promise.then(function(lastRes) {
        result.push(lastRes);
        result = result.slice(1);
        return result;
    })
}

module.exports = Q;
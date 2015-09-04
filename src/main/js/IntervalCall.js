var IntervalCall = function(interval, fonction) {
    setTimeout(function() {
        fonction();
        IntervalCall(interval, fonction);
    }, interval);
}

module.exports = IntervalCall;
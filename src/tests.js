var mocha = require('mocha');
var chai = require("chai");

expect = chai.expect;

console.debug = console.log;

var Logger = require("rauricoste-logger");
var logger = Logger.getLogger("test");

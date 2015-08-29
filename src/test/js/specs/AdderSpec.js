/* import Adder */ var Adder = require('./../../../main/js/services/Adder');

describe("Adder", function() {
    it("should add", function() {
        expect(Adder.add(3)).toBe(4);
    });
});

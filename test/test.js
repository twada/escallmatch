var assert = require('assert'),
    esprima = require('esprima'),
    //esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true},
    esprimaOptions = {tolerant: true},
    estraverse = require('estraverse'),
    esexample = require('..');

it('generate matcher from given example', function () {
    var matcher = esexample('assert($actual)');

    var ast = esprima.parse('it("test foo", function () { assert(foo); })', esprimaOptions);
    var collector = [];
    estraverse.traverse(ast, {
        leave: function (currentNode, parentNode) {
            var matched = matcher.test(currentNode, parentNode);
            if (matched) {
                collector.push(this);
            }
        }
    });

    assert.equal(collector.length, 1);
});

var assert = require('assert'),
    esprima = require('esprima'),
    esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true},
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
                collector.push(currentNode);
            }
        }
    });

    assert.equal(collector.length, 1);
    assert.equal(collector[0].type, 'Identifier');
    assert.equal(collector[0].name, 'foo');
});

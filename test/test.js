var assert = require('assert'),
    esprima = require('esprima'),
    //esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true},
    esprimaOptions = {tolerant: true},
    estraverse = require('estraverse'),
    esexample = require('..');

it('parentEspath', function () {
    assert.equal(esexample.parentEspath('arguments/0/right'), 'arguments/0');
    assert.equal(esexample.parentEspath('arguments/0'), 'arguments');
    assert.equal(esexample.parentEspath('arguments'), '');
    assert.equal(esexample.parentEspath(''), '');
});

it('generate matcher from given example', function () {
    var matcher = esexample('assert($actual)');
    var ast = esprima.parse('assert(foo)', esprimaOptions);
    var collector = [];
    estraverse.traverse(ast, {
        leave: function (currentNode, parentNode) {
            var controller = this;
            collector.push(matcher.test(controller));
        }
    });
    assert(collector.some(function (matched) { return matched; }));
});

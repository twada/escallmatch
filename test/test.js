var assert = require('assert'),
    esexample = require('..');

it('generate matcher from given example', function () {
    var pattern = esexample('assert.equal($actual, $expected)');
    assert(pattern.test('assert.equal(foo, bar)'));
});

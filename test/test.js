var assert = require('assert'),
    esexample = require('..');

it('generate matcher from given example', function () {
    var matcher = esexample('assert.equal($actual, $expected)');
    assert(matcher.test('assert.equal(foo, bar)'));
});

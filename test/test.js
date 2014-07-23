var assert = require('assert'),
    esprima = require('esprima'),
    esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true},
    estraverse = require('estraverse'),
    espurify = require('espurify'),
    esexample = require('..');

function extractArguments (matcher, jsCode) {
    var ast = esprima.parse(jsCode, esprimaOptions);
    var collector = [];
    estraverse.traverse(ast, {
        leave: function (currentNode, parentNode) {
            var matched = matcher.isArgument(currentNode, parentNode);
            if (matched) {
                collector.push(currentNode);
            }
        }
    });
    return collector;
}

it('single identifier', function () {
    var matcher = esexample('assert($actual)');
    var args = extractArguments(matcher, 'it("test foo", function () { assert(foo); })');
    assert.equal(args.length, 1);
    assert.deepEqual(espurify(args[0]), {
        type: 'Identifier',
        name: 'foo'
    });
});

it('two arguments', function () {
    var matcher = esexample('assert.equal($actual, $expected)');
    var args = extractArguments(matcher, 'it("test foo and bar", function () { assert.equal(foo, bar); })');
    assert.equal(args.length, 2);
    assert.deepEqual(espurify(args[0]), {
        type: 'Identifier',
        name: 'foo'
    });
    assert.deepEqual(espurify(args[1]), {
        type: 'Identifier',
        name: 'bar'
    });
});

it('not Identifier', function () {
    var matcher = esexample('assert.equal($actual, $expected)');
    var args = extractArguments(matcher, 'it("test3", function () { assert.equal(toto.tata(baz), moo[0]); })');
    assert.equal(args.length, 2);
    assert.deepEqual(espurify(args[0]), {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
                type: 'Identifier',
                name: 'toto'
            },
            property: {
                type: 'Identifier',
                name: 'tata'
            }
        },
        arguments: [
            {
                type: 'Identifier',
                name: 'baz'
            }
        ]
    });
    assert.deepEqual(espurify(args[1]), {
        type: 'MemberExpression',
        computed: true,
        object: {
            type: 'Identifier',
            name: 'moo'
        },
        property: {
            type: 'Literal',
            value: 0
        }
    });
});

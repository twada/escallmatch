var assert = require('assert'),
    esprima = require('esprima'),
    esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true},
    estraverse = require('estraverse'),
    espurify = require('espurify'),
    escallmatch = require('..');

function captureArguments (matcher, jsCode) {
    var ast = esprima.parse(jsCode, esprimaOptions);
    var collector = {};
    estraverse.traverse(ast, {
        leave: function (currentNode, parentNode) {
            var name = matcher.isCaptured(currentNode, parentNode);
            if (name) {
                collector[name] = currentNode;
            }
        }
    });
    return collector;
}

function extractArguments (matcher, jsCode) {
    var ast = esprima.parse(jsCode, esprimaOptions);
    var collector = [];
    estraverse.traverse(ast, {
        leave: function (currentNode, parentNode) {
            var matched = matcher.isCaptured(currentNode, parentNode);
            if (matched) {
                collector.push(currentNode);
            }
        }
    });
    return collector;
}

function extractCalls (matcher, jsCode) {
    var ast = esprima.parse(jsCode, esprimaOptions);
    var collector = [];
    estraverse.traverse(ast, {
        leave: function (currentNode, parentNode) {
            var matched = matcher.test(currentNode);
            if (matched) {
                collector.push(currentNode);
            }
        }
    });
    return collector;
}


describe('wildcard identifier assert($actual)', function () {
    beforeEach(function () {
        this.matcher = escallmatch('assert($actual)');
    });
    it('single identifier', function () {
        var targetCode = 'it("test foo", function () { assert(foo); })';
        var calls = extractCalls(this.matcher, targetCode);
        var args = extractArguments(this.matcher, targetCode);
        assert.equal(calls.length, 1);
        assert.equal(args.length, 1);
        var captured = captureArguments(this.matcher, targetCode);
        assert(captured['$actual']);
        assert.equal(captured['$actual'].name, 'foo');
    });
    it('optional parameter', function () {
        var targetCode = 'it("test foo", function () { assert(foo, "message"); })';
        var calls = extractCalls(this.matcher, targetCode);
        var args = extractArguments(this.matcher, targetCode);
        assert.equal(calls.length, 1);
        assert.equal(args.length, 1);
        var captured = captureArguments(this.matcher, targetCode);
        assert(captured['$actual']);
        assert.equal(captured['$actual'].name, 'foo');
    });
    it('no params', function () {
        var targetCode = 'it("test foo", function () { assert(); })';
        var calls = extractCalls(this.matcher, targetCode);
        var args = extractArguments(this.matcher, targetCode);
        assert.equal(calls.length, 0);
        assert.equal(args.length, 0);
        var captured = captureArguments(this.matcher, targetCode);
        assert(! captured['$actual']);
    });
});


describe('wildcard two args assert.equal($actual, $expected)', function () {
    beforeEach(function () {
        this.matcher = escallmatch('assert.equal($actual, $expected)');
    });
    it('capture arguments', function () {
        var targetCode = 'it("test foo and bar", function () { assert.equal(foo, bar); })';
        var calls = extractCalls(this.matcher, targetCode);
        var args = extractArguments(this.matcher, targetCode);
        assert.equal(calls.length, 1);
        assert.equal(args.length, 2);
        var captured = captureArguments(this.matcher, targetCode);
        assert(captured['$actual']);
        assert.equal(captured['$actual'].name, 'foo');
        assert(captured['$expected']);
        assert.equal(captured['$expected'].name, 'bar');
    });
    it('optional parameters', function () {
        var targetCode = 'it("test foo and bar", function () { assert.equal(foo, bar, "message"); })';
        var calls = extractCalls(this.matcher, targetCode);
        var args = extractArguments(this.matcher, targetCode);
        assert.equal(calls.length, 1);
        assert.equal(args.length, 2);
        var captured = captureArguments(this.matcher, targetCode);
        assert(captured['$actual']);
        assert.equal(captured['$actual'].name, 'foo');
        assert(captured['$expected']);
        assert.equal(captured['$expected'].name, 'bar');
    });
    it('less parameters', function () {
        var targetCode = 'it("test foo and bar", function () { assert.equal(foo); })';
        var calls = extractCalls(this.matcher, targetCode);
        var args = extractArguments(this.matcher, targetCode);
        assert.equal(calls.length, 0);
        assert.equal(args.length, 0);
        var captured = captureArguments(this.matcher, targetCode);
        assert(! captured['$actual']);
        assert(! captured['$expected']);
    });
});



it('single identifier', function () {
    var matcher = escallmatch('assert($actual)');
    var targetCode = 'it("test foo", function () { assert(foo); })';

    var calls = extractCalls(matcher, targetCode);
    assert.equal(calls.length, 1);
    assert.deepEqual(espurify(calls[0]), {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'assert'
        },
        arguments: [
            {
                type: 'Identifier',
                name: 'foo'
            }
        ]
    });

    var args = extractArguments(matcher, targetCode);
    assert.equal(args.length, 1);
    assert.deepEqual(espurify(args[0]), {
        type: 'Identifier',
        name: 'foo'
    });
});



it('two arguments', function () {
    var matcher = escallmatch('assert.equal($actual, $expected)');
    var targetCode = 'it("test foo and bar", function () { assert.equal(foo, bar); })';

    var calls = extractCalls(matcher, targetCode);
    assert.equal(calls.length, 1);
    assert.deepEqual(espurify(calls[0]), {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
                type: 'Identifier',
                name: 'assert'
            },
            property: {
                type: 'Identifier',
                name: 'equal'
            }
        },
        arguments: [
            {
                type: 'Identifier',
                name: 'foo'
            },
            {
                type: 'Identifier',
                name: 'bar'
            }
        ]
    });

    var args = extractArguments(matcher, targetCode);
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
    var matcher = escallmatch('assert.equal($actual, $expected)');
    var targetCode = 'it("test3", function () { assert.equal(toto.tata(baz), moo[0]); })';

    var calls = extractCalls(matcher, targetCode);
    assert.equal(calls.length, 1);
    assert.deepEqual(espurify(calls[0]), {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
                type: 'Identifier',
                name: 'assert'
            },
            property: {
                type: 'Identifier',
                name: 'equal'
            }
        },
        arguments: [
            {
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
            },
            {
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
            }
        ]
    });

    var args = extractArguments(matcher, targetCode);
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

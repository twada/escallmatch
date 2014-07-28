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

function matchAgainst (that, targetCode) {
    that.calls = extractCalls(that.matcher, targetCode);
    that.args = extractArguments(that.matcher, targetCode);
    that.captured = captureArguments(that.matcher, targetCode);
}


describe('wildcard identifier assert(actual)', function () {
    beforeEach(function () {
        this.matcher = escallmatch('assert(actual)');
    });
    it('single identifier', function () {
        matchAgainst(this, 'it("test foo", function () { assert(foo); })');
        assert.equal(this.calls.length, 1);
        assert.equal(this.args.length, 1);
        assert(this.captured['actual']);
        assert.equal(this.captured['actual'].name, 'foo');
        assert.deepEqual(espurify(this.calls[0]), {
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
        assert.deepEqual(espurify(this.args[0]), {
            type: 'Identifier',
            name: 'foo'
        });
    });
    it('optional parameter', function () {
        matchAgainst(this, 'it("test foo", function () { assert(foo, "message"); })');
        assert.equal(this.calls.length, 1);
        assert.equal(this.args.length, 1);
        assert(this.captured['actual']);
        assert.equal(this.captured['actual'].name, 'foo');
    });
    it('no params', function () {
        matchAgainst(this, 'it("test foo", function () { assert(); })');
        assert.equal(this.calls.length, 0);
        assert.equal(this.args.length, 0);
        assert(! this.captured['actual']);
    });
});


describe('wildcard two args assert.equal(actual, expected)', function () {
    beforeEach(function () {
        this.matcher = escallmatch('assert.equal(actual, expected)');
    });
    it('capture arguments', function () {
        matchAgainst(this, 'it("test foo and bar", function () { assert.equal(foo, bar); })');
        assert.equal(this.calls.length, 1);
        assert.equal(this.args.length, 2);
        assert(this.captured['actual']);
        assert.equal(this.captured['actual'].name, 'foo');
        assert(this.captured['expected']);
        assert.equal(this.captured['expected'].name, 'bar');
        assert.deepEqual(espurify(this.calls[0]), {
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
        assert.deepEqual(espurify(this.args[0]), {
            type: 'Identifier',
            name: 'foo'
        });
        assert.deepEqual(espurify(this.args[1]), {
            type: 'Identifier',
            name: 'bar'
        });
    });
    it('optional parameters', function () {
        matchAgainst(this, 'it("test foo and bar", function () { assert.equal(foo, bar, "message"); })');
        assert.equal(this.calls.length, 1);
        assert.equal(this.args.length, 2);
        assert(this.captured['actual']);
        assert.equal(this.captured['actual'].name, 'foo');
        assert(this.captured['expected']);
        assert.equal(this.captured['expected'].name, 'bar');
    });
    it('less parameters', function () {
        matchAgainst(this, 'it("test foo and bar", function () { assert.equal(foo); })');
        assert.equal(this.calls.length, 0);
        assert.equal(this.args.length, 0);
        assert(! this.captured['actual']);
        assert(! this.captured['expected']);
    });
});



it('not Identifier', function () {
    var matcher = escallmatch('assert.equal(actual, expected)');
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

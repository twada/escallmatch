(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['escallmatch', 'esprima', 'estraverse', 'espurify', 'assert'], factory);
    } else if (typeof exports === 'object') {
        factory(require('..'), require('esprima'), require('estraverse'), require('espurify'), require('assert'));
    } else {
        factory(root.escallmatch, root.esprima, root.estraverse, root.espurify, root.assert);
    }
}(this, function (
    escallmatch,
    esprima,
    estraverse,
    espurify,
    assert
) {


    function matchCode (matcher, targetCode) {
        var esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true};
        var ast = esprima.parse(targetCode, esprimaOptions);
        var calls = [];
        var args = [];
        var captured = {};
        estraverse.traverse(ast, {
            leave: function (currentNode, parentNode) {
                if (matcher.test(currentNode)) {
                    calls.push(currentNode);
                }
                var matched = matcher.matchArgument(currentNode, parentNode);
                if (matched) {
                    args.push(matched);
                    captured[matched.name] = currentNode;
                }
            }
        });
        return {
            calls: calls,
            args: args,
            captured: captured
        };
    }


    describe('API definition validation', function () {
        it('syntax error', function () {
            assert.throws(function () {
                escallmatch('assert(actual, ');
            }, Error);
        });
        it('argument name should be unique', function () {
            assert.throws(function () {
                escallmatch('assert(actual, actual)');
            }, /Duplicate argument name: actual/);
        });
    });


    describe('optional parameter assert(actual, [message])', function () {
        beforeEach(function () {
            this.matcher = escallmatch('assert(actual, [message])');
        });
        it('with message', function () {
            var matched = matchCode(this.matcher, 'it("test foo", function () { assert(foo, "message"); })');
            assert.equal(matched.calls.length, 1);
            assert.equal(matched.args.length, 2);
            assert.deepEqual(matched.args[0], {name: 'actual', kind: 'mandatory'});
            assert.deepEqual(matched.args[1], {name: 'message', kind: 'optional'});
            assert(matched.captured['actual']);
            assert(matched.captured['message']);
            assert.deepEqual(espurify(matched.captured['actual']), {
                type: 'Identifier',
                name: 'foo'
            });
            assert.deepEqual(espurify(matched.captured['message']), {
                type: 'Literal',
                value: 'message'
            });
        });
        it('without message', function () {
            var matched = matchCode(this.matcher, 'it("test foo", function () { assert(foo); })');
            assert.equal(matched.calls.length, 1);
            assert.equal(matched.args.length, 1);
            assert(matched.captured['actual']);
            assert.deepEqual(espurify(matched.captured['actual']), {
                type: 'Identifier',
                name: 'foo'
            });
        });
    });


    describe('one argument assert(actual)', function () {
        beforeEach(function () {
            this.matcher = escallmatch('assert(actual)');
        });
        it('single identifier', function () {
            var matched = matchCode(this.matcher, 'it("test foo", function () { assert(foo); })');
            assert.equal(matched.calls.length, 1);
            assert.equal(matched.args.length, 1);
            assert.deepEqual(matched.args[0], {name: 'actual', kind: 'mandatory'});
            assert.deepEqual(espurify(matched.calls[0]), {
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
            assert.deepEqual(espurify(matched.captured['actual']), {
                type: 'Identifier',
                name: 'foo'
            });
        });
        it('optional parameter', function () {
            var matched = matchCode(this.matcher, 'it("test foo", function () { assert(foo, "message"); })');
            assert.equal(matched.calls.length, 0);
            assert.equal(matched.args.length, 0);
            assert(! matched.captured['actual']);
        });
        it('no params', function () {
            var matched = matchCode(this.matcher, 'it("test foo", function () { assert(); })');
            assert.equal(matched.calls.length, 0);
            assert.equal(matched.args.length, 0);
            assert(! matched.captured['actual']);
        });
    });


    describe('two args assert.equal(actual, expected)', function () {
        beforeEach(function () {
            this.matcher = escallmatch('assert.equal(actual, expected)');
        });
        it('capture arguments', function () {
            var matched = matchCode(this.matcher, 'it("test foo and bar", function () { assert.equal(foo, bar); })');
            assert.equal(matched.calls.length, 1);
            assert.equal(matched.args.length, 2);
            assert.deepEqual(matched.args[0], {name: 'actual', kind: 'mandatory'});
            assert.deepEqual(matched.args[1], {name: 'expected', kind: 'mandatory'});
            assert(matched.captured['actual']);
            assert.equal(matched.captured['actual'].name, 'foo');
            assert(matched.captured['expected']);
            assert.equal(matched.captured['expected'].name, 'bar');
            assert.deepEqual(espurify(matched.calls[0]), {
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
            assert.deepEqual(espurify(matched.captured['actual']), {
                type: 'Identifier',
                name: 'foo'
            });
            assert.deepEqual(espurify(matched.captured['expected']), {
                type: 'Identifier',
                name: 'bar'
            });
        });
        it('optional parameters', function () {
            var matched = matchCode(this.matcher, 'it("test foo and bar", function () { assert.equal(foo, bar, "message"); })');
            assert.equal(matched.calls.length, 0);
            assert.equal(matched.args.length, 0);
            assert(! matched.captured['actual']);
            assert(! matched.captured['expected']);
        });
        it('less parameters', function () {
            var matched = matchCode(this.matcher, 'it("test foo and bar", function () { assert.equal(foo); })');
            assert.equal(matched.calls.length, 0);
            assert.equal(matched.args.length, 0);
            assert(! matched.captured['actual']);
            assert(! matched.captured['expected']);
        });
    });



    it('not Identifier', function () {
        var matcher = escallmatch('assert.equal(actual, expected)');
        var matched = matchCode(matcher, 'it("test3", function () { assert.equal(toto.tata(baz), moo[0]); })');

        assert.equal(matched.calls.length, 1);
        assert.deepEqual(espurify(matched.calls[0]), {
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

        assert.equal(matched.args.length, 2);
        assert.deepEqual(matched.args[0], {name: 'actual', kind: 'mandatory'});
        assert.deepEqual(matched.args[1], {name: 'expected', kind: 'mandatory'});

        assert.deepEqual(espurify(matched.captured['actual']), {
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
        assert.deepEqual(espurify(matched.captured['expected']), {
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


}));

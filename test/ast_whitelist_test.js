'use strict';

var escallmatch = require('..');
var assert = require('assert');
var babelTypes = require('babel-types');
var babylon = require('babylon');
var fs = require('fs');
var path = require('path');
var matchAst = require('./match_ast');

it('JSX and Flow Nodes', function () {
    var code = fs.readFileSync(path.join(__dirname, 'fixtures', 'CounterContainer.jsx'), 'utf8');
    var ast = babylon.parse(code, {
        sourceType: "module",
        plugins: [
            "classProperties",
            "jsx",
            "flow"
        ]
    });
    var matcher = escallmatch('assert(value, [message])', {
        astWhiteList: babelTypes.BUILDER_KEYS,
        visitorKeys: babelTypes.VISITOR_KEYS
    });
    var matched;
    assert.doesNotThrow(function () {
        matched = matchAst(ast, matcher, babelTypes.VISITOR_KEYS);
    });
    assert.equal(matched.calls.length, 0);
});

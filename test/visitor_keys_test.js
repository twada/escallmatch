'use strict';

var escallmatch = require('..');
var assert = require('assert');
var babelTypes = require('babel-types');

//// original code of jsx_test.json:
// var assert = require('power-assert');
// it('CheckboxWithLabel', function() {
//     var CheckboxWithLabel = require('../src/CheckboxWithLabel.js');
//     (<CheckboxWithLabel labelOn="On" labelOff="Off"/>).assert.equals('Off');
// });
var ast = require('./jsx_test.json');
var matchAst = require('./match_ast');

it('custom visitorKeys', function () {
    var visitorKeys = babelTypes.VISITOR_KEYS;
    var matcher = escallmatch('assert.jsx.equal(value, [message])', { visitorKeys: visitorKeys });
    var matched;
    assert.doesNotThrow(function () {
        matched = matchAst(ast, matcher, visitorKeys);
    });
    assert.equal(matched.calls.length, 0);
});

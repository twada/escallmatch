/**
 * escallmatch:
 *   ECMAScript CallExpression matcher made from function/method signature
 * 
 * https://github.com/twada/escallmatch
 *
 * Copyright (c) 2014-2015 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';
/* jshint -W024 */

var esprima = require('esprima');
var CallMatcher = require('call-matcher');
var notCallExprMessage = 'Argument should be in the form of CallExpression';

function createMatcher (signatureStr, options) {
    var ast = extractExpressionFrom(esprima.parse(signatureStr));
    return new CallMatcher(ast, options || {});
}

function extractExpressionFrom (tree) {
    var statement = tree.body[0];
    if (statement.type !== 'ExpressionStatement') {
        throw new Error(notCallExprMessage);
    }
    return statement.expression;
}

module.exports = createMatcher;

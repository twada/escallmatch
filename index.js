/**
 * escallmatch:
 *   ECMAScript CallExpression matcher made from simple API definition
 * 
 * https://github.com/twada/escallmatch
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';
/* jshint -W024 */

var esprima = require('esprima'),
    estraverse = require('estraverse'),
    espurify = require('espurify'),
    syntax = estraverse.Syntax,
    hasOwn = Object.prototype.hasOwnProperty,
    deepEqual = require('deep-equal');

function createMatcher (pattern) {
    var ast = extractExpressionFrom(esprima.parse(pattern));
    validateApiExpression(ast);
    return new Matcher(ast);
}

function Matcher (exampleAst) {
    this.exampleAst = exampleAst;
    this.numMaxArgs = this.exampleAst.arguments.length;
    this.numMinArgs = this.exampleAst.arguments.filter(identifiers).length;
}

Matcher.prototype.test = function (currentNode) {
    var calleeMatched = isCalleeMatched(this.exampleAst, currentNode),
        numArgs;
    if (calleeMatched) {
        numArgs = currentNode.arguments.length;
        return this.numMinArgs <= numArgs && numArgs <= this.numMaxArgs;
    }
    return false;
};

Matcher.prototype.matchArgument = function (currentNode, parentNode) {
    var indexOfCurrentArg;
    if (isCalleeOfParent(currentNode, parentNode)) {
        return null;
    }
    if (this.test(parentNode)) {
        indexOfCurrentArg = parentNode.arguments.indexOf(currentNode);
        if (indexOfCurrentArg < this.exampleAst.arguments.length) {
            return argMatchResult(this.exampleAst.arguments[indexOfCurrentArg]);
        }
    }
    return null;
};

function argMatchResult (argExampleNode) {
    switch(argExampleNode.type) {
    case syntax.Identifier:
        return {
            name: argExampleNode.name,
            kind: 'mandatory'
        };
    case syntax.ArrayExpression:
        return {
            name: argExampleNode.elements[0].name,
            kind: 'optional'
        };
    default:
        return null;
    }
}

function isCalleeMatched(callExp1, callExp2) {
    if (!isCallExpression(callExp1) || !isCallExpression(callExp2)) {
        return false;
    }
    if (astDepth(callExp1.callee) !== astDepth(callExp2.callee)) {
        return false;
    }
    return deepEqual(espurify(callExp1.callee), espurify(callExp2.callee));
}

function astDepth (ast) {
    var maxDepth = 0;
    estraverse.traverse(ast, {
        enter: function (currentNode, parentNode) {
            var path = this.path(),
                currentDepth = path ? path.length : 0;
            if (maxDepth < currentDepth) {
                maxDepth = currentDepth;
            }
        }
    });
    return maxDepth;
}

function isCallExpression (node) {
    return node && node.type === syntax.CallExpression;
}

function isCalleeOfParent(currentNode, parentNode) {
    return parentNode && currentNode &&
        parentNode.type === syntax.CallExpression &&
        parentNode.callee === currentNode;
}

function identifiers (node) {
    return node.type === syntax.Identifier;
}

function validateApiExpression (callExpression) {
    var names = {};
    callExpression.arguments.forEach(function (arg) {
        var name = validateArg(arg);
        if (hasOwn.call(names, name)) {
            throw new Error('Duplicate argument name: ' + name);
        } else {
            names[name] = name;
        }
    });
}

function validateArg (arg) {
    switch(arg.type) {
    case syntax.Identifier:
        return arg.name;
    case syntax.ArrayExpression:
        return arg.elements[0].name;
    default:
        throw new Error('Argument should be in the form of `name` or `[name]`');
    }
}

function extractExpressionFrom (tree) {
    var expressionStatement = tree.body[0],
        expression = expressionStatement.expression;
    return expression;
}

module.exports = createMatcher;

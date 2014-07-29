/**
 * escallmatch
 * 
 * https://github.com/twada/escallmatch
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var esprima = require('esprima'),
    estraverse = require('estraverse'),
    espurify = require('espurify'),
    syntax = estraverse.Syntax,
    deepEqual = require('deep-equal');

function createMatcher (pattern) {
    var ast = extractExpressionFrom(esprima.parse(pattern));
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
    var indexOfCurrentArg, argExample;
    if (isCalleeOfParent(currentNode, parentNode)) {
        return null;
    }
    if (this.test(parentNode)) {
        indexOfCurrentArg = parentNode.arguments.indexOf(currentNode);
        if (indexOfCurrentArg !== -1 && indexOfCurrentArg < this.exampleAst.arguments.length) {
            argExample = this.exampleAst.arguments[indexOfCurrentArg];
            if (argExample.type === syntax.Identifier) {
                return {
                    name: argExample.name,
                    kind: 'mandatory'
                };
            } else if (argExample.type === syntax.ArrayExpression) {
                return {
                    name: argExample.elements[0].name,
                    kind: 'optional'
                };
            }
        }
    }
    return null;
};

function isCalleeMatched(callExp1, callExp2) {
    if (!callExp1 || !callExp2) {
        return false;
    }
    if (callExp1.type !== syntax.CallExpression) {
        return false;
    }
    if (callExp2.type !== syntax.CallExpression) {
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

function isCalleeOfParent(currentNode, parentNode) {
    return parentNode && currentNode &&
        (parentNode.type === syntax.CallExpression || parentNode.type === syntax.NewExpression) &&
        parentNode.callee === currentNode;
}

function startsWith (str, phrase) {
    return str.lastIndexOf(phrase, 0) === 0;
}

function identifiers (node) {
    return node.type === syntax.Identifier;
}

function extractExpressionFrom (tree) {
    var expressionStatement = tree.body[0],
        expression = expressionStatement.expression;
    return expression;
}

module.exports = createMatcher;

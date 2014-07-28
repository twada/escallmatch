var esprima = require('esprima'),
    estraverse = require('estraverse'),
    espurify = require('espurify'),
    syntax = estraverse.Syntax,
    keys = Object.keys || require('object-keys'),
    deepEqual = require('deep-equal');

function createMatcher (pattern) {
    var ast = extractExpressionFrom(esprima.parse(pattern));
    return new Matcher(ast);
}

function Matcher (exampleAst) {
    this.exampleAst = exampleAst;
}

Matcher.prototype.test = function (currentNode) {
    var calleeMatched = matchCallee(this.exampleAst, currentNode);
    if (calleeMatched) {
        return this.exampleAst.arguments.length === currentNode.arguments.length;
    }
    return false;
};

Matcher.prototype.isCaptured = function (currentNode, parentNode) {
    var indexOfCurrentArg;
    if (isCalleeOfParent(currentNode, parentNode)) {
        return null;
    }
    if (this.test(parentNode)) {
        indexOfCurrentArg = parentNode.arguments.indexOf(currentNode);
        if (indexOfCurrentArg !== -1 && indexOfCurrentArg < this.exampleAst.arguments.length) {
            var node = this.exampleAst.arguments[indexOfCurrentArg];
            if (node.type === syntax.Identifier) {
                return node.name;
            } else if (node.type === syntax.ArrayExpression) {
                return node.elements[0].name;
            }
        }
    }
    return null;
};

function matchCallee(callExp1, callExp2) {
    if (!callExp1 || !callExp2) {
        return false;
    }
    if (callExp1.type !== syntax.CallExpression) {
        return false;
    }
    if (callExp2.type !== syntax.CallExpression) {
        return false;
    }

    var depth1 = astDepth(callExp1.callee);
    var depth2 = astDepth(callExp2.callee);
    if (depth1 !== depth2) {
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

function extractExpressionFrom (tree) {
    var expressionStatement = tree.body[0],
        expression = expressionStatement.expression;
    return expression;
}

module.exports = createMatcher;

var esprima = require('esprima'),
    estraverse = require('estraverse'),
    espurify = require('espurify'),
    syntax = estraverse.Syntax,
    keys = Object.keys || require('object-keys'),
    deepEqual = require('deep-equal'),
    esprimaOptions = {tolerant: true};

function createMatcher (pattern) {
    var ast = extractExpressionFrom(esprima.parse(pattern, esprimaOptions));
    return new Matcher(ast);
}

function Matcher (exampleAst) {
    this.rules = rules(exampleAst);
}

Matcher.prototype.test = function (currentNode) {
    var that = this;
    return keys(that.rules).map(function (key) {
        return that.rules[key];
    }).some(function (val) {
        return matchCallExpWithoutArgs(val.parentNode, currentNode);
    });
};

Matcher.prototype.isArgument = function (currentNode, parentNode) {
    var that = this;
    return keys(that.rules).map(function (key) {
        return that.rules[key];
    }).some(function (val) {
        return matchCallExpWithoutArgs(val.parentNode, parentNode, currentNode);
    });
};

function matchCallExpWithoutArgs(callExp1, callExp2, callExp2Child) {
    if (!callExp1 || !callExp2) {
        return false;
    }
    if (callExp1.type !== syntax.CallExpression) {
        return false;
    }
    if (callExp2.type !== syntax.CallExpression) {
        return false;
    }
    if (callExp2Child && isCalleeOfParent(callExp2, callExp2Child)) {
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

function rules (exampleAst) {
    var rules = {};
    estraverse.traverse(exampleAst, {
        leave: function (currentNode, parentNode) {
            var controller = this,
                path = controller.path(),
                espath = path ? path.join('/') : '';
            if (currentNode.type === syntax.Identifier && startsWith(currentNode.name, '$')) {
                rules[currentNode.name] = {
                    name: currentNode.name,
                    espath: espath,
                    currentNode: currentNode,
                    parentNode: parentNode
                };
            }
        }
    });
    return rules;
}

function isCalleeOfParent(parentNode, currentNode) {
    return (parentNode.type === syntax.CallExpression || parentNode.type === syntax.NewExpression) &&
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

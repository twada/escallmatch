var esprima = require('esprima'),
    estraverse = require('estraverse'),
    syntax = estraverse.Syntax,
    keys = Object.keys || require('object-keys'),
    deepEqual = require('deep-equal'),
    //esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true};
    esprimaOptions = {tolerant: true};

function createMatcher (pattern) {
    var ast = extractExpressionFrom(esprima.parse(pattern, esprimaOptions));
    return new Matcher(ast);
}

function Matcher (exampleAst) {
    this.rules = rules(exampleAst);
}
Matcher.prototype.test = function (currentNode, parentNode) {
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
    if (isCalleeOfParent(callExp2, callExp2Child)) {
        return false;
    }
    return deepEqual(callExp1.callee, callExp2.callee);
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

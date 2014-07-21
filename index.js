var esprima = require('esprima'),
    estraverse = require('estraverse'),
    syntax = estraverse.Syntax,
    keys = Object.keys || require('object-keys'),
    //esprimaOptions = {tolerant: true, loc: true, tokens: true, raw: true},
    esprimaOptions = {tolerant: true};

function createMatcher (pattern) {
    var ast = extractExpressionFrom(esprima.parse(pattern, esprimaOptions));
    return new Matcher(ast);
}

function Matcher (exampleAst) {
    this.rules = rules(exampleAst);
    console.log(JSON.stringify(this.rules, null, 2));
}
Matcher.prototype.test = function (controller) {
    var that = this;
    return keys(that.rules).map(function (key) {
        return that.rules[key];
    }).some(function (val) {
        val.parentNodes;
    });
    return false;
};


function rules (exampleAst) {
    var pathToNode = {};
    var rules = {};
    estraverse.traverse(exampleAst, {
        enter: function (currentNode, parentNode) {
            var path = this.path(),
                espath = path ? path.join('/') : '';
            pathToNode[espath] = currentNode;
        },
        leave: function (currentNode, parentNode) {
            var controller = this,
                path = controller.path(),
                espath = path ? path.join('/') : '';
            if (currentNode.type === syntax.Identifier && startsWith(currentNode.name, '$')) {
                // var nodes = [];
                // collect(nodes, espath, pathToNode);
                // nodes.shift();
                rules[currentNode.name] = {
                    espath: espath,
                    currentNode: currentNode,
                    parentNodes: controller.parents()
                };
            }
        }
    });
    return rules;
}

function collect (acc, espath, pathToNode) {
    var node = pathToNode[espath];
    if (node) {
        acc.push(node);
    }
    if (espath === '') {
        return;
    } else {
        collect(acc, parentEspath(espath), pathToNode);
    }
}

function parentEspath (espath) {
    var elements = espath.split('/');
    return elements.slice(0, elements.length - 1).join('/');
}

function startsWith (str, phrase) {
    return str.lastIndexOf(phrase, 0) === 0;
}

function extractExpressionFrom (tree) {
    var expressionStatement = tree.body[0],
        expression = expressionStatement.expression;
    return expression;
}

createMatcher.parentEspath = parentEspath;
module.exports = createMatcher;

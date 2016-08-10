'use strict';

var estraverse = require('estraverse');

module.exports = function matchAst (ast, matcher, visitorKeys) {
    var calls = [];
    var args = [];
    var captured = {};
    estraverse.traverse(ast, {
        keys: visitorKeys,
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
};

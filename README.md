escallmatch
================================

ECMAScript CallExpression matcher made from simple API definition

[![Build Status](https://travis-ci.org/twada/escallmatch.svg?branch=master)](https://travis-ci.org/twada/escallmatch)
[![NPM version](https://badge.fury.io/js/escallmatch.svg)](http://badge.fury.io/js/escallmatch)
[![Dependency Status](https://gemnasium.com/twada/escallmatch.svg)](https://gemnasium.com/twada/escallmatch)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://twada.mit-license.org/)
[![Built with Gulp](http://img.shields.io/badge/built_with-gulp-brightgreen.svg)](http://gulpjs.com/)



EXAMPLE
---------------------------------------

```javascript
var escallmatch = require('escallmatch'),
    esprima = require('esprima'),
    estraverse = require('estraverse'),
    fs = require('fs');

var matcher = escallmatch('assert.equal(actual, expected, [message])');

estraverse.traverse(esprima.parse(fs.readFileSync('path/to/some_test.js')), {
    enter: function (currentNode, parentNode) {
        if (matcher.test(currentNode)) {
            // currentNode is a CallExpression that matches to the API definition
        }
        var argMatched = matcher.matchArgument(currentNode, parentNode);
        if (argMatched) {
            if (argMatched.kind === 'mandatory') {
                // mandatory arg (in this case, `actual` or `expected`)
            } else if (argMatched.kind === 'optional') {
                // optional arg (in this case, `message`)
            }
        }
    }
});
```

Please note that `escallmatch` is an alpha version product. Pull-requests, issue reports and patches are always welcomed. `escallmatch` is a spin-off product of [power-assert](http://github.com/twada/power-assert) project.



API
---------------------------------------

### var matcher = escallmatch(definitionStr)

Create matcher object for a given function/method API definition string.

```javascript
var matcher = escallmatch('assert.equal(actual, expected, [message])');
```

Any arguments enclosed in bracket (for example, `[message]`) means optional parameters. Without bracket means mandatory parameters.

Returns `matcher` object having two methods, `test` and `matchArgument`.


### var isMatched = matcher.test(node)

Tests whether `node` matches the API definition or not.

 - Returns `true` if matched.
 - Returns `false` if not matched.

`node` should be an AST node object defined in [Mozilla JavaScript AST spec](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API).


### var argMatched = matcher.matchArgument(node, parentNode)

Returns match result object representing whether `node` (and its `parentNode`) matches some argument of the API definition or not.

 - Returns `null` if not matched.
 - If matched, returns object like `{name: 'actual', kind: 'mandatory'}`, whose `name` is an argument name in the API definition and `kind` is `'mandatory'` or `'optional'`.

`node` and `parentNode` should be AST node objects defined in [Mozilla JavaScript AST spec](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API).



INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save escallmatch


### via bower

Install

    $ bower install --save escallmatch

Then load (`escallmatch` function is exported)

    <script type="text/javascript" src="./path/to/bower_components/escallmatch/build/escallmatch.js"></script>



AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)



LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/) license.

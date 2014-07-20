function Matcher (pattern) {
}
Matcher.prototype.test = function () {
    return false;
};

module.exports = function (pattern) {
    return new Matcher(pattern);
};

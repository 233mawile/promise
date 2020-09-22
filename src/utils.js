module.exports.queueTask = function (fn) {
  setTimeout(fn, 0);
};

module.exports.isFunction = function (p) {
  return typeof p === "function";
};

module.exports.isObjectExceptNull = function (p) {
  return typeof p === "object" && p !== null;
};

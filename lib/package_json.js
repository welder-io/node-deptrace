const promise = require('bluebird');

module.exports = function (key) {
  if (!key) {
    throw new Error('Please specify a dependency key.');
  }
  return function (input) {
    var deps = input[key] || [];
    return promise.resolve(Object.keys(deps).map(function(depName) {
      return {
        name: depName,
        version: deps[depName]
      };
    }));
  }.bind(this);
};

const promise = require('bluebird');

var Deptrace = module.exports = function Deptrace (opts) {
  opts = opts || {};
  if (opts.depsFor) {
    this.depsFor = opts.depsFor;
  } else {
    throw new Error('You must provide a method to find dependencies.');
  }
  if (opts.setup) {
    this.setup = opts.setup;
  }
  if (opts.resolve) {
    this.resolve = opts.resolve;
  }
  if (opts.format) {
    this.format = opts.format;
  }
  this.concurrency = opts.concurrency || require('os').cpus().length;
};

// extract an array of dependencies from some input
Deptrace.prototype.depsFor = function (input) {
  throw new Error('Implement a method to return an array of dependencies.');
};

// resolve an individual dependency into a more detailed form
Deptrace.prototype.resolve = function (dep, parents) {
  return promise.resolve(dep);
};

// format a node in a dependency graph after all dependencies are resolved
Deptrace.prototype.format = function (input, nodes) {
  input.label = input.name;
  input.nodes = nodes;
  return promise.resolve(input);
};

Deptrace.prototype.graph = function (input, parents) {
  var ready = promise.resolve();
  var initialCall = (arguments.length === 1);

  if (!parents) {
    parents = [];

    if (typeof this.setup === 'function') {
      ready = promise.resolve(this.setup());
    }
  }

  return ready.then(function () {
    parents = parents.slice();
    parents.push(input);

    var recurse = this._recurse(input, parents);
    if (initialCall) {
      recurse = recurse.then(this.format.bind(this, input));
    }
    return recurse;
  }.bind(this));
};

Deptrace.prototype._recurse = function (input, parents) {
  return this.depsFor(input).
    map(function (dep) {
      return this.resolve(dep, parents);
    }.bind(this)).
    map(function (dep) {
      return this.graph(dep, parents).
        then(this.format.bind(this, dep));
    }.bind(this));
};

Deptrace.packageJson = require('./lib/package_json');

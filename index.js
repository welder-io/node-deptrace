const promise = require('bluebird');

var Deptrace = module.exports = function Deptrace (opts) {
  opts = opts || {};
  if (opts.depsFor) {
    this.depsFor = opts.depsFor;
  } else {
    throw new Error('You must provide a method to find dependencies.');
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
Deptrace.prototype.format = function (input, children, allNodes) {
  return promise.resolve({
    label: input.name,
    children: children,
    nodes: allNodes
  });
};

Deptrace.prototype.graph = function (input, parents) {
  if (!parents) {
    parents = [];
  }
  parents = parents.slice();
  parents.push(input);
  return this.depsFor(input).
    map(function (dep) {
      return this.resolve(dep, parents);
    }.bind(this)).
    then(this._recurse.bind(this, input, parents));
};

Deptrace.prototype._recurse = function (input, parents, deps) {
  // we lose the resolved version of each dep here because we
  // replace each dependency with the graphed version of itself
  return promise.resolve(deps).
    map(function (dep) {
      return this.graph(dep, parents);
    }.bind(this)).
    then(this.format.bind(this, input, deps));
};

Deptrace.packageJson = require('./lib/package_json');

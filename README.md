# deptrace [![Build Status](https://secure.travis-ci.org/gitfuse/deptrace.png)](http://travis-ci.org/gitfuse/deptrace)
> Trace and format recursive dependency trees asynchronously.

[![NPM](https://nodei.co/npm/deptrace.png)](https://nodei.co/npm/deptrace/)

### API

### constructor(opts)

Create an instance of Deptrace to trace your dependencies.

```js
const tracer = new Deptrace({
  depsFor: function (input) {
    // extract an array of dependencies from some input
  },
  resolve: function (dep, parents) {
    // resolve an individual dependency into a more detailed form
  },
  format: function (input, children, tree) {
    // format a node in a dependency graph after all dependencies are resolved
  },
  concurrency: 4
});
```

#### opts.depsFor(input)

Receives an object and must return a promise yielding an array of its dependencies.

Type: `Function`  
Default: `null`

Example extracting an array of dependencies from the contents of a `package.json` file.
```js
const Deptrace = require('./');
const archy = require('archy');
const promise = require('bluebird');

const tracer = new Deptrace({
  depsFor: function (input) {
    var deps = input.dependencies || [];
    return promise.resolve(Object.keys(deps).map(function(depName) {
      return {
        name: depName,
        version: deps[depName]
      };  
    }))
  }
});
tracer.graph(require('./package.json')).then(function (graph) {
  console.log(archy(graph));
});
```

#### opts.resolve(dep, parents)

Receives each dependency gathered by `depsFor`, as well as an array of all parent dependencies.  Must return a promise.  This method is optional and can be used to resolve a more detailed represenstation of a dependency.  (e.g. converting the name of a dependency in package.json to the actual package.json of *that* dependency).

Type: `Function`  
Default: [see source](https://github.com/gitfuse/deptrace/blob/master/index.js#L25-27)

Here is a naive example which can trace dependencies for any npm module for which all dependencies are on github:
```js
const Deptrace = require('./');
const archy = require('archy');
const githubUrlFromGit = require('github-url-from-git');
const promise = require('bluebird');
const request = promise.promisify(require('request').get);
const tracer = new Deptrace({
  depsFor: Deptrace.packageJson('dependencies'),
  resolve: function (dep, parents) {
    return request('http://registry.npmjs.org/'+dep.name).
      get(1).
      then(JSON.parse).
      then(function(pkg) {
        return [
          'https://raw.githubusercontent.com',
          url.parse(githubUrlFromGit(pkg.repository.url)).path,
          '/master/package.json'
        ].join('');
      }).
      then(request).
      get(1).
      then(JSON.parse);
  }
});
var requestPkg = require('./node_modules/request/package.json');
tracer.graph(requestPkg).then(function (graph) {
  console.log(archy(graph));
});
```

#### opts.format(input, nodes)

This method can be used to format the result for each node of the graph after all of its direct dependencies have been resolved.

Type: `Function`  
Default: [see source](https://github.com/gitfuse/deptrace/blob/master/index.js#L30-35)

The default implementation formats the dependency graph to be compatible with [archy](https://github.com/substack/node-archy) (as follows):
```js
{
  label: 'parent',
  nodes: [
    {
      label: 'child'
      nodes: [
        {
          label: 'subchild'
          nodes: []
        }
      ]
    }
  ]
}
```

### graph(input)

Asynchronously trace a dependency graph for the provided input.

### Deptrace.packageJson(field)

This helper can be used to generate a [depsFor](#optsdepsforinput) method that will extract an array of name/version dependencies from the specified dependency field in a `package.json` file.  See example for [opts.resolve(deps, parents)](#optsresolvedep-parents).

const expect = require('chai').expect;
const path = require('path');
const url = require('url');
const promise = require('bluebird');

const Deptrace = require('../');
const packageJson = require('../lib/package_json');

const FSTrace = new Deptrace({
  depsFor: Deptrace.packageJson('dependencies'),
  resolve: function (dep, parents) {
    var parentNames = parents.map(function (p) { return p.name; });
    var pkgPath = [
      '../node_modules/',
      parentNames.join('/node_modules/'),
      '/node_modules/',
      dep.name,
      '/package'
    ];
    var pkg = require(pkgPath.join(''));
    return {
      name: pkg.name,
      dependencies: pkg.dependencies
    };
  }
});

describe('packageJson', function () {

  it('should return a method which in turn transforms an input object property to an array of name/version objects', function () {
    var getDependencies = packageJson('dependencies');
    return getDependencies({
      dependencies: {
        moduleOne: '0.1.0',
        moduleTwo: '0.2.0'
      }
    }).then(function (deps) {
      expect(deps).to.deep.equal([
        {
          name: 'moduleOne',
          version: '0.1.0'
        },
        {
          name: 'moduleTwo',
          version: '0.2.0'
        }
      ]);
    });
  });

});

describe('graph', function () {
  this.timeout(10000);

  var pkg = require('../node_modules/chai/package');

  it('should trace a dependency graph on the file system', function () {
    return FSTrace.graph({name:pkg.name,dependencies:pkg.dependencies})
      .then(function (graph) {
        expect(graph).to.deep.equal({"name":"chai","dependencies":{"assertion-error":"1.0.0","deep-eql":"0.1.3"},"label":"chai","nodes":[{"name":"assertion-error","dependencies":{},"label":"assertion-error","nodes":[]},{"name":"deep-eql","dependencies":{"type-detect":"0.1.1"},"label":"deep-eql","nodes":[{"name":"type-detect","dependencies":{},"label":"type-detect","nodes":[]}]}]});
      });
  });

  it('should run a setup method once before kicking off a graph', function () {
    var called = 0;
    FSTrace.setup = function () {
      called++;
    };
    FSTrace.graph({name:pkg.name,dependencies:pkg.dependencies})
      .then(function () {
        expect(called).to.equal(1);
      });
  });

});

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
    return require(pkgPath.join(''));
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

describe('deptrace', function () {
  this.timeout(10000);

  it('should trace a dependency graph on the file system', function () {
    return FSTrace.graph(require('../node_modules/mocha/package'))
      .then(function (graph) {
        expect(graph).to.deep.equal({"label":"mocha","nodes":[{"label":"commander","nodes":[]},{"label":"growl","nodes":[]},{"label":"jade","nodes":[{"label":"commander","nodes":[]},{"label":"mkdirp","nodes":[]}]},{"label":"diff","nodes":[]},{"label":"debug","nodes":[{"label":"ms","nodes":[]}]},{"label":"mkdirp","nodes":[]},{"label":"glob","nodes":[{"label":"minimatch","nodes":[{"label":"lru-cache","nodes":[]},{"label":"sigmund","nodes":[]}]},{"label":"graceful-fs","nodes":[]},{"label":"inherits","nodes":[]}]}]});
      });
  });

});

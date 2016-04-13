var should = require('should');
var stub = require('sinon').stub;
var proxyquire = require('proxyquire');
proxyquire.noCallThru();

describe('util.js', function(){
  var unit;

  beforeEach(function(done){
    unit = proxyquire('../../lib/permission/util', {});
    done();
  });

  describe('#buildContext', function(){
    it('should work with org', function(){
      var result = unit.buildContext({org:'a'});
      result.should.equal('a');
    });
    it('should work with org, region', function(){
      var result = unit.buildContext({org: 'a', region: 'b'});
      result.should.equal('a:b');
    });
    it('should work with org, region, app', function(){
      var result = unit.buildContext({org: 'a', region: 'b', app: 'c'});
      result.should.equal('a:b:c');
    });
    it('should work with org, region, app, stack', function(){
      var result = unit.buildContext({org: 'a', region: 'b', app: 'c', stack: 'd'});
      result.should.equal('a:b:c:d');
    });
    it('should work with type', function(){
      var result = unit.buildContext({org: 'a', type: 'b'});
      result.should.equal('a:b');
    });
    it('should work with type, distributions', function(){
      var result = unit.buildContext({org: 'a', type: 'b', distribution: 'c'});
      result.should.equal('a:b:c');
    });

    it('should work with type, distributions, origins', function(){
      var result = unit.buildContext({org: 'a', type: 'b', distribution: 'c', origin: 'd'});
      result.should.equal('a:b:c:d');
    });
  })
});

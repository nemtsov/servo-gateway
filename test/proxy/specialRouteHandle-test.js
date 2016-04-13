var should = require('should');
var stub = require('sinon').stub;
var proxyquire = require('proxyquire');
proxyquire.noCallThru();

describe('specialRouteHandle.js', function(){
  var unit, proxyRequest, addPermission, removePermission, res;

  beforeEach(function(done){
    proxyRequest = stub();
    addPermission = stub();
    removePermission = stub();
    res = {
      set: function() {return this;},
      status: function(){ return this;},
      send: function() {}
    };

    unit = proxyquire('../../lib/proxy/specialRouteHandle', {
      './index': {proxyRequest: proxyRequest},
      '../permission':  {
        add: addPermission,
        remove: removePermission
      }
    });
    done();
  });

  describe('#post()', function(){

  });

  describe('#delete()', function(){

  });

  describe('#postDistribution()', function(){

  });

  describe('#deleteDistribution', function(){
    it('Should return a 500 if request fails', function(done) {
      proxyRequest.yields('test', {}, '');
      res.statusCode = function(code) {
        code.should.equal(500);
      }
      res.send = function(message) {
        should.exist(message);
        message.indexOf('Gateway Error').should.be.greaterThan(-1);
        done();
      }
      unit.deleteDistribution({}, res);
    });

    it('Should return a 204 if request completes', function(done) {
      proxyRequest.yields(null, {statusCode:204}, 'test');
      res.statusCode = function(code) {
        code.should.equal(204);
      }
      res.send = function(message) {
        should.exist(message);
        message.should.equal('test');
        done();
      }
      unit.deleteDistribution({context: {a:'a'}}, res);
    });
  });
});

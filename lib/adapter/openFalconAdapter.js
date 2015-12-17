var BaseAdapter = require('./baseAdapter');
var util = require('util');
var request = require('request');

function OpenFalconAdapter(config) {
  BaseAdapter.call(this);
  this._uri = 'http://' + config.host + ':' + config.port;
}

util.inherits(OpenFalconAdapter, BaseAdapter);

OpenFalconAdapter.prototype.transport = function(data, done) {
  var pushUri = this._uri + '/api/push';
  request({
    method: 'PUT',
    uri: pushUri,
    body: JSON.stringify(data),
  }, function (err, resp, body) {
      done();
  });
};

OpenFalconAdapter.prototype.parse = function(data) {
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var itemname = this._resolveItemNames(item);

  return [
    {
      endpoint: host.host.replace(/\s/g, '\\ '),
      metric: item.key_ + '.min',
      timestamp: row.clock,
      step: 3600,
      value: row.value_min,
      counterType: 'GAUGE',
      tag: 'itemname=' + itemname + ', app=' + app_name,
    }, {
      endpoint: host.host.replace(/\s/g, '\\ '),
      metric: item.key_ + '.max',
      timestamp: row.clock,
      step: 3600,
      value: row.value_max,
      counterType: 'GAUGE',
      tag: 'itemname=' + itemname + ', app=' + app_name,
    }, {
      endpoint: host.host.replace(/\s/g, '\\ '),
      metric: item.key_ + '.avg',
      timestamp: row.clock,
      step: 3600,
      value: row.value_avg,
      counterType: 'GAUGE',
      tag: 'itemname=' + itemname + ', app=' + app_name,
    }
  ];
};

module.exports = OpenFalconAdapter;

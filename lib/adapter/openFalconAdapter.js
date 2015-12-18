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
  }, done);
};

OpenFalconAdapter.prototype.parse = function(data) {
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var item_name = this._resolveItemNames(item);

  function create(type, value) {
    return {
      endpoint: host.host,
      metric: item.key_ + '.' + type,
      timestamp: row.clock,
      step: 3600,
      value: value,
      counterType: 'GAUGE',
      tag: 'item_name=' + item_name + ',app=' + app_name,
    };
  }

  return [
    create('min', row.value_min),
    create('max', row.value_max),
    create('avg', row.value_avg),
  ];
};

module.exports = OpenFalconAdapter;

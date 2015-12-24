var BaseAdapter = require('./baseAdapter');
var util = require('util');
var request = require('request');
var _ = require('lodash');

function OpenFalconAdapter(uri) {
  BaseAdapter.call(this);
  var regex = /(\S+):(\d+)/;
  var result = uri.match(regex);
  this._uri = 'http://' + result[1] + ':' + result[2];
}

util.inherits(OpenFalconAdapter, BaseAdapter);

OpenFalconAdapter.prototype.transport = function(data, done) {
  var pushUri = this._uri + '/api/push';
  var chunks = _.chunk(data, 500);
  var length = chunks.length;
  var count = 0;
  if (data.length === 0) {
    done(null);
  }
  chunks.forEach(function(chunk, index) {
    setTimeout(function() {
      request({
        method: 'PUT',
        uri: pushUri,
        body: JSON.stringify(chunk),
      }, function(err, resp) {
        count ++;
        if (err) {
          console.log(err);
        }
        if (count >= length) {
          done(null);
        }
      });
    }, 500*index);
  });

};

OpenFalconAdapter.prototype.parse = function(data, histype) {
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var item_name = this._resolveItemNames(item);

  function create(type, value, step) {
    return {
      endpoint: host.host,
      metric: item.key_ + type,
      timestamp: row.clock,
      step: step,
      value: parseFloat(value),
      counterType: 'GAUGE',
      tag: 'item_name=' + item_name + ',app=' + app_name,
    };
  }

  var records = [];
  if (histype === 'history') {
    records = [
      create('', row.value, parseInt(item.delay)),
    ];
  }
  else {
    records = [
      create('.min', row.value_min, 3600),
      create('.max', row.value_max, 3600),
      create('.avg', row.value_avg, 3600),
    ];
  }

  return records;
};

module.exports = OpenFalconAdapter;

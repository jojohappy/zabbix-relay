var BaseAdapter = require('./baseAdapter');
var influx = require('influx');
var util = require('util');

function InfluxdbAdapter(config) {
  BaseAdapter.call(this);
  this._client = influx(config);
}

util.inherits(InfluxdbAdapter, BaseAdapter);

InfluxdbAdapter.prototype.transport = function(data, done) {
  this._client.writeSeries(data, done);
};

InfluxdbAdapter.prototype.parse = function(data) {
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var metric = this._metrics(app_name);
  var key = this._resolveItemNames(item);
  var clock = parseInt(row.clock + '000');

  var series = {};
  var point = [{
    min: row.value_min,
    max: row.value_max,
    avg: row.value_avg,
    time: new Date(clock),
  }, {
    host: host.host.replace(/\s/g, '\\ '),
    key: key,
    app: app_name.replace(/\s/g, '\\ '),
  }];
  series[metric] = [point];
  return series;
};

module.exports = InfluxdbAdapter;

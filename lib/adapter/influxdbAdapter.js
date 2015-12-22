var BaseAdapter = require('./baseAdapter');
var influx = require('influx');
var util = require('util');
var _ = require('lodash');

function InfluxdbAdapter(config) {
  BaseAdapter.call(this);
  this._client = influx(config);
}

util.inherits(InfluxdbAdapter, BaseAdapter);

InfluxdbAdapter.prototype.transport = function(data, done) {
  var records = {};
  data.forEach(function(d) {
    var series = _.keys(d)[0];
    if (!_.has(records, series)) {
      records[series] = [];
    }
    records[series] = records[series].concat(d[series]);
  });
  this._client.writeSeries(records, done);
};

InfluxdbAdapter.prototype.parse = function(data) {
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var metric = this._metrics(app_name);
  var item_name = this._resolveItemNames(item);
  var clock = parseInt(row.clock + '000');

  var series = {};
  var point = [{
    min: row.value_min,
    max: row.value_max,
    avg: row.value_avg,
    time: new Date(clock),
  }, {
    host: host.host.replace(/\s/g, '\\ '),
    key: item.key_.replace(/\s/g, '\\ ').replace(/,/g, '\\,'),
    app: app_name.replace(/\s/g, '\\ '),
    item_name: item_name.replace(/\s/g, '\\ '),
  }];
  series[metric] = [point];

  return [series];
};

module.exports = InfluxdbAdapter;

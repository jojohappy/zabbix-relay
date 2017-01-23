var BaseAdapter = require('./baseAdapter');
var influx = require('influx');
var util = require('util');
var _ = require('lodash');

function InfluxdbAdapter(uri) {
  BaseAdapter.call(this);
  var regex = /(.+):(.+)@(\S+):(\d+)\/(.+)/;
  var result = uri.match(regex);
  this._client = influx({
    host: result[3],
    port: result[4],
    protocol: 'http',
    username: result[1],
    password: result[2],
    database: result[5],
    failoverTimeout: 600000,
  });
}

util.inherits(InfluxdbAdapter, BaseAdapter);

InfluxdbAdapter.prototype.transport = function(data, done) {
  var t = {};
  if (!data || data.length === 0) {
    return done(null);
  }
  data.forEach(function(d) {
    var series = _.keys(d)[0];
    if (!_.has(t, series)) {
      t[series] = [];
    }
    t[series] = t[series].concat(d[series]);
  });
  var series = _.keys(t)[0];
  var records = t[series];
  this._client.writePoints(series, records, function(err, resp) {
    if (err) {
      console.log('influx error code: ' + err.code);
    }
    done(err);
  });
};

InfluxdbAdapter.prototype.parse = function(data, histype) {
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var metric = this._metrics(app_name);
  var item_name = this._resolveItemNames(item);
  var clock = parseInt(row.clock + '000');

  var point = {};
  if (histype === 'history') {
    point = {
      value: row.value,
      time: new Date(clock),
    };
  }
  else {
    point = {
      min: row.value_min,
      max: row.value_max,
      avg: row.value_avg,
      time: new Date(clock),
    };
  }
  var series = {};
  var points = [point, {
    host: host.host.replace(/\s/g, '\\ '),
    key: item.key_.replace(/\s/g, '\\ ').replace(/,/g, '\\,'),
    app: app_name.replace(/\s/g, '\\ '),
    item_name: item_name.replace(/\s/g, '\\ ').replace(/,/g, '\\,'),
  }];
  series[metric] = [points];

  return [series];
};

module.exports = InfluxdbAdapter;

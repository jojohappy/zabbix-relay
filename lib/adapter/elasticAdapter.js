var BaseAdapter = require('./baseAdapter');
var util = require('util');
var elasticsearch = require('elasticsearch');
var moment = require('moment');
var _ = require('lodash');

function ElasticAdapter(uri) {
  BaseAdapter.call(this);
  this._client = new elasticsearch.Client({
    host: uri
  });
}

util.inherits(ElasticAdapter, BaseAdapter);

ElasticAdapter.prototype.transport = function(data, done) {
  var self = this;
  if (!data || data.length === 0) {
    return done(null);
  }
  this._client.ping({
    requestTimeout: 10000,
  }, function(error) {
    if (error) {
      done(error);
    } else {
      self._client.bulk({
        timeout: '10000ms',
        body: data
      }, done);
    }
  });
};

ElasticAdapter.prototype.parse = function(data, histype) {
  var bulk_message = [];
  var row = data.data;
  var host = data.host;
  var item = data.item;
  var app_name = item.applications.length === 0 ? 'Other' : item.applications[0].name;
  var item_name = this._resolveItemNames(item);
  var unique_id = this._generateUniqueId();
  var clock = moment.unix(row.clock).format();

  var record = {
    '@timestamp': clock,
    host: host.host,
    item: item_name,
    key: item.key_,
    app: app_name,
  };
  var type = '';
  if (histype === 'history') {
    record.value = row.value;
    type = 'zabbix.history';
  }
  else {
    record = _.merge(record, {
      min: row.value_min,
      max: row.value_max,
      avg: row.value_avg
    });
    type = 'zabbix.archive';
  }

  var target_index = util.format('%s-%s', type, moment.unix(row.clock).format('YYYY.MM.DD'));
  var meta = {
      index: {
      _index: target_index,
      _type: type,
      _id: unique_id,
    }
  };

  bulk_message.push(meta, record);
  return bulk_message;
};

module.exports = ElasticAdapter;

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');

function parseSql(valueType, itemid) {
  var table = valueType === '3' ? 'trends_uint' : 'trends';
  return 'select * from ' + table + ' where itemid=' + itemid + ' and clock >1449936000 order by clock asc;';
}

function start(done) {
  var self = this;
  var count = 0;

  function fetchTrends(item, callback) {
    var sql = parseSql(item.value_type, item.itemid);
    var query = self.connection.query(sql);
    var records = [];
    query
      .on('error', function(err) {
        console.error(err);
        process.exit(1);
      })
      .on('result', function(row) {
        records = records.concat(self.adapter.parse({
          data: row,
          host: self.host,
          item: item
        }));
      })
      .on('end', function() {
        self.emit('transport', records, callback);
      });
  }

  return function() {
    self.zapi.call('item.get', {hostids: self.host.hostid, selectApplications: ['name']}, function(err, resp, items) {
      var length = items.length;
      var finish = 0;
      items.forEach(function(item) {
        fetchTrends(item, function(err,resp) {
          if (err) {
            console.error(err);
          }
          finish ++;
          if (finish >= length) {
            done(err);
          }
        });
      });
    });
  };
}

function Task(host, connection, adapter, zapi) {
  EventEmitter.call(this);
  this.connection = connection;
  this.host = host;
  this.adapter = adapter;
  this.zapi = zapi;
}

util.inherits(Task, EventEmitter);

Task.prototype.run = function(done) {
  this.on('transport', this.adapter.transport.bind(this.adapter));
  this.once('start', start.bind(this)(done));
  this.emit('start');
};

module.exports = Task;

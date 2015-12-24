var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');

var SQL_TPL = 'select * from %s where itemid=%d and clock >= %d and clock <= %d order by clock asc;';

function Task(options) {
  EventEmitter.call(this);
  this.options = options || {};
}

util.inherits(Task, EventEmitter);

Task.prototype.run = function(done) {
  this.on('transport', this.options.adapter.transport.bind(this.options.adapter));
  this.once('start', start.bind(this)(done));
  this.emit('start');
};

Task.prototype._parseSql = function(valueType, itemid) {
  var table = '';
  if (valueType !== 3 && valueType !== 0) {
    return null;
  }
  if (this.options.histype === 'history') {
    table = valueType === 3 ? 'history_uint' : 'history';
  }
  else {
    table = valueType === 3 ? 'trends_uint' : 'trends';
  }
  return util.format(SQL_TPL, table, parseInt(itemid), this.options.period.start, this.options.period.end);
};

function start(done) {
  var self = this;
  var count = 0;

  function fetchTrends(item, callback) {
    var sql = self._parseSql(parseInt(item.value_type), item.itemid);
    if (!sql) {
      return callback(null);
    }
    var query = self.options.connection.query(sql);
    var records = [];
    query
      .on('error', function(err) {
        console.error(err);
        process.exit(1);
      })
      .on('result', function(row) {
        self.options.connection.pause();
        records = records.concat(self.options.adapter.parse({
          data: row,
          host: self.options.host,
          item: item
        }, self.options.histype));
        self.options.connection.resume();
      })
      .on('end', function() {
        self.emit('transport', records, callback);
      });
  }

  return function() {
    self.options.zapi.call('item.get', {hostids: self.options.host.hostid, selectApplications: ['name']}, function(err, resp, items) {
      var length = items.length;
      var finish = 0;
      items.forEach(function(item) {
        fetchTrends(item, function(err,resp) {
          if (err) {
            console.error('task err:' + err);
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

module.exports = Task;

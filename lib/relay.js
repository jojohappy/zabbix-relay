var _ = require('lodash');
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config.js').zabbix;
var Task = require('./task');
var moment = require('moment');

var Relay = function(connection) {
  this.connection = connection;
};

Relay.prototype.run = function(options) {
  console.log('start relay');
  var self = this;
  var _start = moment().unix();
  var zapi = new zabbix(zabbixConfig.url, zabbixConfig.username, zabbixConfig.password);
  var adapterClass = require(__dirname + '/adapter/' + options.database.adapter);
  zapi.login(function(err, resp, body) {
    if (err) {
      console.log('zabbix api error: ' + err);
      process.exit(1);
    }

    zapi.call(
      'hostgroup.get',
      {
        filter: {
          name: options.hostgroup
        },
        selectHosts: 'extend'
      }, function(err, resp, body) {
        if (err) {
          console.log(err);
          process.exit(1);
        }
        if (!body || body.length === 0) {
          console.log('No hosts in hostgroup ' + options.hostgroup);
          process.exit(1);
        }
        var hostgroup = body[0];
        var length = hostgroup.hosts.length;
        var finish = 0;
        console.log('Total ' + length + ' hosts');
        hostgroup.hosts.forEach(function(host, index) {
          var adapter = new adapterClass(options.database.uri);
          var task = new Task({
            host: host,
            connection: self.connection,
            adapter: adapter,
            zapi: zapi,
            histype: options.histype,
            period: {
              start: options.start,
              end: options.end
            }
          });
          setTimeout(function() {
            task.run(function(err) {
              if (err) {
                console.error('relay err:' + err);
              }
              console.log(host.host + ' finished');
              finish ++;
              if (finish >= length) {
                self.connection.end();
                var spend = moment().unix() - _start;
                console.log('relay completed! Total spend ' + spend + ' seconds');
                process.exit(0);
              }
            });
          }, 300*index);
        });
    });
  });
};

module.exports = Relay;

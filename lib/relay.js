var _ = require('lodash');
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config.js').zabbix;
var Task = require('./task');
var shell = require('./shell');

module.exports = function(connection) {
  shell.run(function(result) {
    var zapi = new zabbix(zabbixConfig.url, zabbixConfig.username, zabbixConfig.password);
    var adapterClass = require(__dirname + '/adapter/' + result.database.adapter);
    zapi.login(function(err, resp, body) {
      if (err) {
        console.log('zabbix api error: ' + err);
        process.exit(1);
      }

      zapi.call(
        'hostgroup.get',
        {
          filter: {
            name: result.hostgroup
          },
          selectHosts: 'extend'
        }, function(err, resp, body) {
          if (err) {
            console.log(err);
            process.exit(1);
          }
          if (!body || body.length === 0) {
            console.log('No hosts in hostgroup ' + result.hostgroup);
            process.exit(1);
          }
          var hostgroup = body[0];
          var length = hostgroup.hosts.length;
          var finish = 0;
          hostgroup.hosts.forEach(function(host) {
            var adapter = new adapterClass(result.database.uri);
            var task = new Task({
              host: host,
              connection: connection,
              adapter: adapter,
              zapi: zapi,
              histypet: result.histype,
              period: {
                start: result.start,
                end: result.end
              }
            });
            task.run(function(err) {
              if (err) {
                console.error('relay err:' + err);
              }
              console.log(host.host + ' is over');
              finish ++;
              if (finish >= length) {
                connection.end();
                process.exit(0);
              }
            });
          });
      });
    });
  });
};

var _ = require('lodash');
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config.js').zabbix;
var Task = require('./task');
var shell = require('./shell');
var argv = require('./options').argv;
var moment = require('moment');
var connections;

function relay(result) {
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
        hostgroup.hosts.forEach(function(host, index) {
          var adapter = new adapterClass(result.database.uri);
          var task = new Task({
            host: host,
            connection: connections,
            adapter: adapter,
            zapi: zapi,
            histype: result.histype,
            period: {
              start: result.start,
              end: result.end
            }
          });
          setTimeout(function() {
            task.run(function(err) {
              if (err) {
                console.error('relay err:' + err);
              }
              console.log(host.host + ' is over');
              finish ++;
              if (finish >= length) {
                connections.end();
                process.exit(0);
              }
            });
          }, 500*index);
        });
    });
  });
}

function sh() {
  shell.run(relay);
}

function cli() {
  var result = {
    hostgroup: argv.g,
    histype: argv.t,
    database: {
      adapter: argv.d + 'Adapter',
      uri: argv.u,
    }
  };
  var timePeriod = argv.p.split('|');
  result.start = moment(timePeriod[0]).unix();
  result.end = moment(timePeriod[1]).unix();
  relay(result);
}

module.exports = function(connection) {
  var command = argv._[0];
  connections = connection;
  if (command === 'command') {
    cli();
  }
  else if (command === 'shell') {
    sh();
  }
};

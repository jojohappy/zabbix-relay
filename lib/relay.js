var _ = require('lodash');
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config.js').zabbix;
var Task = require('./task');
var shell = require('./shell');
var argv = require('./options').argv;
var moment = require('moment');
var connections;

function relay(options) {
  console.log('start relay');
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
            connection: connections,
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
              console.log(host.host + ' is over');
              finish ++;
              if (finish >= length) {
                connections.end();
                var spend = moment().unix() - _start;
                console.log('relay completed! Total spend ' + spend + ' seconds');
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
  var options = {
    hostgroup: argv.g,
    histype: argv.t,
    database: {
      adapter: argv.d + 'Adapter',
      uri: argv.u,
    }
  };

  if (argv.l && argv.p) {
    console.log('Option time period and last are only support one.');
    process.exit(1);
  }

  if (argv.p) {
    var timePeriod = argv.p.split('|');
    options.start = moment(timePeriod[0]).unix();
    options.end = moment(timePeriod[1]).unix();
  }
  else if (argv.l) {
    var gap = argv.l.slice(0, argv.l.length - 1);
    var unit = argv.l.slice(argv.l.length - 1, argv.l.length);
    options.end = moment().unix();
    switch (unit) {
      case 'm':
        options.start = options.end - 60 * gap;
        break;
      case 'h':
        options.start = options.end - 60 * 60 * gap;
        break;
      case 'd':
        options.start = options.end - 60 * 60 * 24 * gap;
        break;
      case 'w':
        options.start = options.end - 60 * 60 * 24 * 7 * gap;
        break;
      case 'M':
        options.start = options.end - 60 * 60 * 24 * 30 * gap;
        break;
    }
  }
  else {
    console.log('Option time period or last is required.');
    process.exit(1);
  }

  relay(options);
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

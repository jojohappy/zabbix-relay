var _ = require('lodash');
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config.js').zabbix;
var Task = require('./task');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

function welcome() {
  console.log([
              'Zabbix Relay ',
              'Welcome, choose the storage that you want to input',
              '[1] Influxdb'
            ].join('\n'));
  prompt();
}

function prompt() {
  rl.setPrompt('> ');
  rl.prompt();
}

function question(done) {
  welcome();
  rl.on('line', function(line) {
    switch (line) {
      case '1':
        rl.question("Please input the uri for Influxdb\ne.g. user:password@localhost:8086/db\n> ", function(answer) {
          var regex = /(\w+):(\w+)@(\S+):(\d+)\/(\w+)/;
          var result = answer.match(regex);
          var InfluxdbAdapter = require('./adapter/influxdbAdapter');
          var adapter = new InfluxdbAdapter({
            host: result[3],
            port: result[4],
            protocol: 'http',
            username: result[1],
            password: result[2],
            database: result[5]
          });
          rl.close();
          done(adapter);
        });
        break;
    }
  });
}

module.exports = function(connection) {
  question(function(adapter) {
    var zapi = new zabbix(zabbixConfig.url, zabbixConfig.username, zabbixConfig.password);
    zapi.login(function(err, resp, body) {
      if (err) {
        console.log('zabbix api error: ' + err);
        process.exit(1);
      }

      zapi.call('host.get', {groupids: '10'}, function(err, resp, body) {
        body.forEach(function(host) {
          var task = new Task(host, connection, adapter, zapi);
          task.run(function() {
            console.log(host.host + ' is over');
            connection.end();
          });
        });
      });
    });
  });
};

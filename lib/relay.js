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
              '[1] Influxdb',
              '[2] Open-falcon',
              '[3] Elasticsearch'
            ].join('\n'));
  prompt();
}

function prompt() {
  rl.setPrompt('> ');
  rl.prompt();
}

function question(done) {
  welcome();

  function answers(answer, line) {
    var regex = /./;
    var result = [];
    var adapter = null;
    switch (line) {
      case '1':
        regex = /(\w+):(\w+)@(\S+):(\d+)\/(\w+)/;
        result = answer.match(regex);
        var InfluxdbAdapter = require('./adapter/influxdbAdapter');
        adapter = new InfluxdbAdapter({
          host: result[3],
          port: result[4],
          protocol: 'http',
          username: result[1],
          password: result[2],
          database: result[5]
        });
        break;
      case '2':
        regex = /(\S+):(\d+)/;
        result = answer.match(regex);
        var OpenFalconAdapter = require('./adapter/openFalconAdapter');
        adapter = new OpenFalconAdapter({
          host: result[1],
          port: result[2],
        });
        break;
      case '3':
        var ElasticAdapter = require('./adapter/elasticAdapter');
        adapter = new ElasticAdapter(answer);
        break;
    }
    rl.close();
    done(adapter);
  }

  rl.on('line', function(line) {
    var question = '';
    switch (line) {
      case '1':
        question = 'Please input the uri for Influxdb\ne.g. user:password@host:port/database\n> ';
        break;
      case '2':
        question = 'Please input the uri for Open-falcon\ne.g. host:port\n> ';
        break;
      case '3':
        question = 'Please input the uri for Elasticsearch\ne.g. host:port\n> ';
        break;
    }
    rl.question(question, function(answer) {
      answers(answer, line);
    });
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
          task.run(function(err) {
            if (err) {
              console.error(err);
            }
            console.log(host.host + ' is over');
            connection.end();
          });
        });
      });
    });
  });
};

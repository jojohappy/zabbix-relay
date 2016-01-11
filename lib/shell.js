var EventEmitter = require('events').EventEmitter;
var util = require('util');
var moment = require('moment');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

function Shell() {
  EventEmitter.call(this);
  this._max_step = 5;
  this._cur_step = 1;
  this._questions = {
    3: ['Please input the hostgroup name that you want to export data'],
    4: ['Choose history or trends', '[1] History', '[2] Trends'],
    5: ['Please input the time period', 'e.g. YYYY-MM-DD|YYYY-MM-DD'],
  };
  this._databases = {
    '1': {
      adapter: 'influxdbAdapter',
      question: ['Please input the uri for Influxdb', 'e.g. user:password@host:port/database'],
    },
    '2': {
      adapter: 'openFalconAdapter',
      question: ['Please input the uri for Open-falcon', 'e.g. host:port'],
    },
    '3': {
      adapter: 'elasticAdapter',
      question: ['Please input the uri for Elasticsearch', 'e.g. host:port'],
    },
  };
  this.result = {};

}

util.inherits(Shell, EventEmitter);

Shell.prototype._welcome = function() {
  console.log([
              'Zabbix Relay',
              'Welcome, choose the time-series database that you want to relay',
              '[1] Influxdb',
              '[2] Open-falcon',
              '[3] Elasticsearch'
            ].join('\n'));
  this._prompt();
};

Shell.prototype._prompt = function() {
  rl.setPrompt('> ');
  rl.prompt();
};

Shell.prototype._question = function() {
  var self = this;
  return function(step, database) {
    if (step === 2) {
      console.log(database.question.join('\n'));
    }
    else {
      console.log(self._questions[step].join('\n'));
    }
    self._prompt();
  };
};

Shell.prototype._answer = function(done) {
  var self = this;
  return function(line) {
    var database = {};
    switch (self._cur_step) {
      case 1:
        database = self._databases[line];
        self.result.database = database;
        break;
      case 2:
        self.result.database.uri = line;
        break;
      case 3:
        self.result.hostgroup = line;
        break;
      case 4:
        self.result.histype = line === '1' ? 'history' : 'trends';
        break;
      case 5:
        var timePeriod = line.split('|');
        self.result.start = moment(timePeriod[0]).unix();
        self.result.end = moment(timePeriod[1]).unix();
        break;
      default:
        break;
    }

    if (self._cur_step === self._max_step) {
      rl.close();
      return done(self.result);
    }
    self._cur_step ++;
    self.emit('question', self._cur_step, database);
  };
};

Shell.prototype.run = function(done) {
  rl.on('line', this._answer(done).bind(this));
  this.on('question', this._question().bind(this));
  this._welcome();
};

module.exports = new Shell();

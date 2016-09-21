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
    5: ['Please input the time period or last', 'e.g. YYYY-MM-DD HH:mm:ss|YYYY-MM-DD HH:mm:ss, 5m, 1h, 2d, 3w, 1M'],
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
  this.options = {};

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
        self.options.database = database;
        break;
      case 2:
        self.options.database.uri = line;
        break;
      case 3:
        self.options.hostgroup = line;
        break;
      case 4:
        self.options.histype = line === '1' ? 'history' : 'trends';
        break;
      case 5:
        if (-1 !== line.indexOf('|')) {
          var timePeriod = line.split('|');
          self.options.start = moment(timePeriod[0]).unix();
          self.options.end = moment(timePeriod[1]).unix();
        }
        else {
          var gap = line.slice(0, line.length - 1);
          var unit = line.slice(line.length - 1, line.length);
          self.options.end = moment().unix();
          switch (unit) {
            case 'm':
              self.options.start = self.options.end - 60 * gap;
              break;
            case 'H':
            case 'h':
              self.options.start = self.options.end - 60 * 60 * gap;
              break;
            case 'D':
            case 'd':
              self.options.start = self.options.end - 60 * 60 * 24 * gap;
              break;
            case 'W':
            case 'w':
              self.options.start = self.options.end - 60 * 60 * 24 * 7 * gap;
              break;
            case 'M':
              self.options.start = self.options.end - 60 * 60 * 24 * 30 * gap;
              break;
            default:
              self.options.start = self.options.end;
              break;
          }
        }
        break;
      default:
        break;
    }

    if (self._cur_step === self._max_step) {
      rl.close();
      return done(self.options);
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

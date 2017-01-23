var moment = require('moment');
var argv = require('./options').argv;
var shell = require('./shell');
var Relay = require('./relay');

function sh(relay) {
  shell.run(relay.run.bind(relay));
}

function cli(relay) {
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

  relay.run(options);
}

module.exports = function(connection) {
  var command = argv._[0];
  var relay = new Relay(connection);
  switch(command) {
    case 'command':
      cli(relay);
      break;
    case 'shell':
      sh(relay);
      break;
    default:
      console.error('Unknown command');
      process.exit(1);
  }
};
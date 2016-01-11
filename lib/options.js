var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('shell', 'Run with shell')
    .command('command', 'Run with arguments', function(yargs) {
      argv = yargs.option('d', {
        alias: 'database',
        demand: true,
        describe: 'time-series database',
        type: 'string',
        choices: ['elastic', 'influxdb', 'openFalcon']
      })
      .option('g', {
        alias: 'hostgroup',
        demand: true,
        describe: 'zabbix hostgroup',
        type: 'string'
      })
      .option('t', {
        alias: 'type',
        demand: false,
        default: 'trend',
        describe: 'history type',
        choices: ['history', 'trends'],
        type: 'string'
      })
      .option('p', {
        alias: 'period',
        demand: true,
        describe: 'time period. e.g. YYYY-MM-DD|YYYY-MM-DD',
        type: 'string'
      })
      .option('u', {
        alias: 'uri',
        demand: true,
        describe: 'the uri for time-series database\ninfluxdb: user:password@host:port/database\nopen-falcon&elasticsearch: host:port',
        type: 'string'
      })
      .argv;
    })
    .demand(1)
    .help('help')
    .alias('h', 'help')
    .argv;

exports.argv = argv;

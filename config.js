var _ = require('lodash');

var defaultConfig = {
  mysql: {
    host: 'localhost',
    user: 'test',
    password: '',
    database: 'zabbix',
    port: 3306
  },
  zabbix: {
    url: 'http://localhost/zabbix/api_jsonrpc.php',
    username: 'admin',
    password: 'zabbix'
  }
};

var config = {
  production: function() {
    return _.merge(defaultConfig, require('./config.production.js'));
  },
  development: function() {
    return _.merge(defaultConfig, {
    });
  },
  test: function() {
    return _.merge(defaultConfig, {
    });
  }
};

var env = process.env.NODE_ENV || 'development';
module.exports = config[env]();

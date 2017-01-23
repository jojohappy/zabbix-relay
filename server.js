var mysqlConfig = require('./config.js').mysql;
var mysql = require('mysql');
var exec = require('./lib/exec');

function initApp() {
  var connection = mysql.createConnection(mysqlConfig);
  connection.connect(function(err) {
    if (err) {
      console.error('error mysql connecting: ' + err.stack);
      process.exit(1);
    }
    exec(connection);
  });
}

initApp();

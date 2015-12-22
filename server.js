var mysqlConfig = require('./config.js').mysql;
var mysql = require('mysql');
var run = require('./lib/relay');

function initApp() {
  var connection = mysql.createConnection(mysqlConfig);
  connection.connect(function() {
    run(connection);
  });
}

initApp();

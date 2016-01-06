var _ = require('lodash');
var shasum = require('shasum');

function BaseAdapter(config) {
}

BaseAdapter.prototype._metrics = function(app) {
  var metric = {
    'CPU':'CPU',
    'Disk':'Disk',
    'Filesystems':'Filesystems',
    'General':'System',
    'ICMP':'ICMP',
    'Memory':'Memory',
    'netfilter':'Netfilter',
    'Network interfaces':'Network',
    'OS':'System',
    'Performance':'CPU',
    'Processes':'System',
    'Security':'System',
    'socket summary':'Socket',
    'Zabbix agent':'Zabbix',
    'Kat':'Kat',
    'Keepalived':'Keepalived',
    'Libvirtd':'Libvirtd',
    'Logcube':'Logcube',
    'Memcached':'Memcached',
    'Mi':'Mi',
    'Nginx':'Nginx',
    'Nginx Throughput':'Nginx',
    'Nginx Utilization':'Nginx',
    'php-fpm':'Php-fpm',
    'RabbitMQ':'RabbitMQ',
    'Zabbix proxy':'Zabbix',
    'Zabbix server':'Zabbix',
    'ZooKeeper':'ZooKeeper',
    'HardwareError':'Hardware',
    'IPMI Log':'IPMI',
    'IPMI Sensor':'IPMI',
    'MySQL DBA':'Mysql',
    'MySQL':'Mysql',
    'MySQL Slave':'Mysql',
    'Redis':'Redis',
    'Redis Slave':'Redis',
    'Cluster Repl':'Mysql_MGC',
    'Cluster State':'Mysql_MGC',
    'Local Availability':'Mysql_MGC',
    'Node State':'Mysql_MGC',
    'Repl State':'Mysql_MGC',
    'Url':'Url',
    'NTP':'NTP',
    'Sentinel':'Sentinel',
    'Interfaces':'Switch_Network',
    'dubbo-admin':'SOA',
    'influxdb-port':'SOA',
    'Kafka-port':'SOA',
    'soa-admin':'SOA',
    'soa-api':'SOA',
    'soa-datatask':'SOA',
    'soa-monitor':'SOA',
    'soa-registry-portal':'SOA',
    'Zookeeper-port':'SOA',
    'Other': 'Other',
  };
  if (_.has(metric, app)) {
    return metric[app];
  }
  else {
    return app;
  }
};

BaseAdapter.prototype._resolveItemNames = function(item) {
  var name = item.name;
  var key = item.key_;
  var result = name.match(/\$(\d+)/g);
  if (!result) {
    return name;
  }

  var params = key.slice(key.indexOf('[') + 1, key.indexOf(']'));
  var splitParams = params.split(',');

  result.forEach(function(r) {
    var num = r.substring(1);
    name = name.replace(/\$(\d+)/, splitParams[num - 1]);
  });
  return name;
};

BaseAdapter.prototype._generateUniqueId = function() {
  var now = new Date();
  var u1 = ((now.valueOf() * 1000 + now.getMilliseconds()) << 12 | Math.floor(Math.random() * 0xfff));
  var unique_array = [u1 >> 32, u1 & 0xffffffff, Math.floor((Math.random()+1) * 0xffffffff), Math.floor((Math.random()+2) *0xffffffff)];
  return new Buffer(shasum(unique_array)).toString('base64');
};

module.exports = BaseAdapter;

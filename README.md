# Zabbix Relay

## Description

A client for exporting history data from zabbix to time-series database and another monitoring system

## Support time-series database

* influxdb
* elasticsearch
* open-falcon

## Next step

* opentsdb
* prometheus

## Example

You should create the configuration file named config.production.js that specify the configuration of zabbix api and zabbix database first. 

```
module.exports = {
  mysql: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zabbix',
    port: 3308
  },
  zabbix: {
    url: 'http://localhost/zabbix/api_jsonrpc.php',
    username: 'Admin',
    password: 'zabbix'
  }
};
```

Zabbix relay support both cli and shell mode.

```
[root@localhost zabbix-relay]# node server.js --help
Usage: server.js <command> [options]

Commands:
  shell    Run with shell
  command  Run with arguments

Options:
  -h, --help  Show help                                                [boolean]
```


### Shell

Run command

```
NODE_ENV=production node server.js shell
```

Choose the target

```
Zabbix Relay
Welcome, choose the time-series database that you want to relay
[1] Influxdb
[2] Open-falcon
[3] Elasticsearch
>
```

Then, input options

```
Please input the uri for Influxdb
e.g. user:password@host:port/database
> test:test@localhost:8086/mydb
Please input the hostgroup name that you want to export data
> Test Group
Choose history or trends
[1] History
[2] Trends
> 1
Please input the time period
e.g. YYYY-MM-DD|YYYY-MM-DD
> 2015-12-21|2015-12-25
```


### CLI

```
[root@localhost zabbix-relay]# node server.js command
Options:
  -d, --database   time-series database
              [string] [required] [choices: "elastic", "influxdb", "openFalcon"]
  -g, --hostgroup  zabbix hostgroup                          [string] [required]
  -t, --type       history type
                      [string] [choices: "history", "trends"] [default: "trends"]
  -p, --period     time period. e.g. YYYY-MM-DD|YYYY-MM-DD   [string] [required]
  -u, --uri        the uri for time-series database
                   influxdb: user:password@host:port/database
                   open-falcon&elasticsearch: host:port
                   [string] [required]
```

Run command

```
NODE_ENV=production node server.js command -d elastic -g 'Test Group' -p '2015-12-21|2015-12-25' -t 'trends' -u 'test:test@localhost:8086/mydb'
```


## Contribute

Send a pull request to [http://github.com/jojohappy/zabbix-relay](http://github.com/jojohappy/zabbix-relay). 

Use [http://github.com/jojohappy/zabbix-relay/issues](http://github.com/jojohappy/zabbix-relay/issues) for discussion.

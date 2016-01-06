#!/bin/sh

new_time='2015-07-01'

for (( c=0; c<=2; c++ ))
do
  startd=$(date -d "$new_time+$c day" "+%Y.%m.%d");
  echo "$startd"
  curl -XPUT 'http://localhost/zabbix.archive-'$startd'/' -d '
  {
    "mappings": {
        "zabbix-archive": {
          "properties": {
            "@timestamp": {
              "type": "date",
              "format": "strict_date_optional_time||epoch_millis"
            },
            "app": {
              "type": "string"
            },
            "avg": {
              "type": "double"
            },
            "host": {
              "type": "string"
            },
            "item": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "max": {
              "type": "double"
            },
            "min": {
              "type": "double"
            }
          }
        }
      }
  }'
done

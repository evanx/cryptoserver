#!/bin/bash

# enviroment

c1start() {
  cs_PORT=8443 \
  cs_SERVER_KEY=tmp/certs/server.key \
  cs_SERVER_CERT=tmp/certs/server.cert \
  cs_CA_CERT=tmp/certs/ca.cert \
  cs_SECRET_TIMEOUT_SECS=180 \
  NODE_ENV=testing \
  npm start | node_modules/.bin/bunyan -o keyspace
}

# util methods

c2get() {
  uri=$1
  user=$2
  echo "GET $uri as $user"
  curl -s -k https://localhost:8443/$uri --key tmp/certs/$user.key --cert tmp/certs/$user.cert 
  echo " (exitCode $?)"
}

c1get() {
  c2get $1 evan
}

c3post() {
  uri=$1
  user=$2
  data=$3
  echo "POST $uri as $user with data '$data'"
  curl -s -k https://localhost:8443/$uri -d "$data" --key tmp/certs/$user.key --cert tmp/certs/$user.cert
  echo " (exitCode $?)"
}

c1info() {
  keyName=$1
  c1get key/$keyName 
}

# keyName context

keyName=testdek

c0postsecret2() {
  c3post secret/$keyName evan "eeeeee"
  c3post secret/$keyName henry "hhhhhh"
}

c0postsecret3() {
  c3post secret/$keyName evan "eeeeee"
  c3post secret/$keyName henry "hhhhhh"
  c3post secret/$keyName brent "bbbbbb"
}

c0genkey() {
  c2get genkey/$keyName/3 evan
}

c1hget() {
  hkey=$1
  echo; echo '$' redis-cli redis hget dek:$keyName $hkey 
  redis-cli hget dek:$keyName $hkey
}

c0redisShow() {
  echo '$' redis-cli keys 'dek:*'
  redis-cli keys 'dek:*'
  echo; echo '$' redis-cli hkeys "dek:$keyName"
  redis-cli hkeys "dek:$keyName"
  echo; 
  c1hget iterationCount
  c1hget algorithm
  c1hget dek:brent:evan
  c1hget dek:brent:henry
  c1hget dek:evan:henry
}

c0clear() {
  redis-cli del "dek:$keyName"
}

c0client() {
  c0genkey
  #c0postsecret2
  #return
  c0postsecret3
  sleep 1 
  c1get key/$keyName  
  c1get load/$keyName 
  c0postsecret2
}

c0clientTask() {
  out=tmp/client.out
  sleep 1
  c0client > $out
  sleep 1
  echo; echo "## client output"
  cat $out 
  sleep 2
  c0redisShow
}

c0kill() {
  fuser -k 8443/tcp
}

c0default() {
  c0kill
  c0clear
  c0clientTask & 
    c0start | node_modules/.bin/bunyan -o short
}

if [ $# -gt 0 ]
then
  command=$1
  shift
  c$#$command $@
else
  c0default
fi






c1curlget() {
  uri=$1
  curl -s -k https://localhost:8443/$uri --key tmp/certs/evan.key --cert tmp/certs/evan.cert 
}

keyName=testdek

c0redisShow() {
   echo; echo + redis-cli keys 'dek:*'
   redis-cli keys 'dek:*'
   echo; echo + redis-cli hkeys "dek:$keyName"
   redis-cli hkeys "dek:$keyName"
   echo; echo + redis-cli redis hget "dek:$keyName"
   redis-cli hget "dek:$keyName" 'brent:evan'
   redis-cli hget "dek:$keyName" 'brent:henry'
   redis-cli hget "dek:$keyName" 'evan:henry'
}


  fuser -k 8443/tcp

  redis-cli del "dek:$keyName"

  clientout=tmp/client.out
  rm -f $clientout
  ( 
    sleep .6
    sh scripts/genkey.sh >> $clientout
  ) & 
  ( 
    sleep 2
    sh scripts/keyinfo.sh >> $clientout
    sleep .2
    c1curlget load/$keyName >> $clientout
    echo; echo "## client"
    cat $clientout
    c0redisShow
   
  ) & 
    sleep .1
    nodejs lib/app_keyserver.js | bunyan



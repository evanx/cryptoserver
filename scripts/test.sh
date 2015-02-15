

c0redisShow() {
   echo; echo + redis-cli keys 'dek:*'
   redis-cli keys 'dek:*'
   echo; echo + redis-cli hkeys 'dek:testdek'
   redis-cli hkeys 'dek:testdek'
   echo; echo + redis-cli redis hget 'dek:testdek'
   redis-cli hget 'dek:testdek' 'brent:evan'
   redis-cli hget 'dek:testdek' 'brent:henry'
   redis-cli hget 'dek:testdek' 'evan:henry'
}


  fuser -k 8443/tcp

  redis-cli del 'dek:dek2015'
  redis-cli del 'dek:testdek'

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
    echo; echo "## client"
    cat $clientout
    c0redisShow
   
  ) & 
    sleep .1
    nodejs lib/app_keyserver.js | bunyan



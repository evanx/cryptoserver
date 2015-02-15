

c0redisShow() {
   echo + redis-cli keys 'dek:*'
   redis-cli keys 'dek:*'
   echo + redis-cli hkeys 'dek:testdek'
   redis-cli hkeys 'dek:testdek'
   echo + redis-cli redis hget 'dek:testdek' 'brent:evan'
   redis-cli hget 'dek:testdek' 'brent:evan'
}


  fuser -k 8443/tcp

  redis-cli del 'dek:dek2015'
  redis-cli del 'dek:testdek'

  ( 
    sleep .6
    sh scripts/genkey.sh > tmp/genkey
  ) & 
  ( 
    sleep 2
    echo; echo "## client"
    cat tmp/genkey
    c0redisShow
  ) & 
    sleep .1
    nodejs lib/app_keyserver.js | bunyan



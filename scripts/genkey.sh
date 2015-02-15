 
  curl -s -k https://localhost:8443/genkey/testdek/3 --key tmp/certs/evan.key --cert tmp/certs/evan.cert 
  exitCode=$?
  echo; echo $exitCode
  sleep .1

  curl -s -k https://localhost:8443/secret/testdek -d 'eee' --key tmp/certs/evan.key --cert tmp/certs/evan.cert
  exitCode=$?
  echo; echo $exitCode
  sleep .1

  curl -s -k https://localhost:8443/secret/testdek -d 'hhh' --key tmp/certs/henry.key --cert tmp/certs/henry.cert 
  exitCode=$?
  echo; echo $exitCode
  sleep .1

  curl -s -k https://localhost:8443/secret/testdek -d 'bbb' --key tmp/certs/brent.key --cert tmp/certs/brent.cert
  exitCode=$?
  echo; echo $exitCode
  sleep .1


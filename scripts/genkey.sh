
  curl -s -k https://localhost:8443/genkey/dek2015/3 --key tmp/certs/evan.key --cert tmp/certs/evan.cert
  echo

  curl -s -k https://localhost:8443/secret/dek2015 -d 'password1234' --key tmp/certs/evan.key --cert tmp/certs/evan.cert
  echo

  curl -s -k https://localhost:8443/secret/dek2015 -d 'password1234' --key tmp/certs/henry.key --cert tmp/certs/henry.cert
  echo

  curl -s -k https://localhost:8443/secret/dek2015 -d 'password1234' --key tmp/certs/brent.key --cert tmp/certs/brent.cert
  echo


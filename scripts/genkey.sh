
  curl -s -k https://localhost:8443/genkey/dek2015/3
  echo

  curl -s -k https://localhost:8443/secret/dek2015/evan -d 'password1234'
  echo

  curl -s -k https://localhost:8443/secret/dek2015/henry -d 'password1234'
  echo

  curl -s -k https://localhost:8443/secret/dek2015/brent -d 'password1234'
  echo


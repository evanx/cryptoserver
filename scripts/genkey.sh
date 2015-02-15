 

c3post() {
  uri=$1
  user=$2
  data=$3
  curl -s -k https://localhost:8443/$uri -d "$data" --key tmp/certs/$user.key --cert tmp/certs/$user.cert
  exitCode=$?
  echo " (exitCode $exitCode)"
  sleep .1

}

c2get() {
  uri=$1
  user=$2
  curl -s -k https://localhost:8443/$uri --key tmp/certs/$user.key --cert tmp/certs/$user.cert
  exitCode=$?
  echo " (exitCode $exitCode)"
  sleep .1
}

  c2get genkey/testdek/3 evan
  c3post secret/testdek evan eee
  c3post secret/testdek henry eee
  c3post secret/testdek brent bbb


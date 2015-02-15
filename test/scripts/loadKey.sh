 
c1load() {
  keyName=$1
  curl -s -k https://localhost:8443/load/$keyName --key tmp/certs/evan.key --cert tmp/certs/evan.cert 
  echo
}

if [ $# -gt 0 ]
then
  command=$1
  shift
  c$#$command $@
else 
  c1load testdek
fi


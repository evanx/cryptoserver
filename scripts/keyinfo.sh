 
c1info() {
  keyName=$1
  curl -s -k https://localhost:8443/key/$keyName --key tmp/certs/evan.key --cert tmp/certs/evan.cert 
  echo
}

if [ $# -gt 0 ]
then
  command=$1
  shift
  c$#$command $@
else 
  c1info testdek
fi


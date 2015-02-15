
set -u 

mkdir -p tmp/certs

cd tmp/certs 

rm -f ca.* server.* evan.* brent.* henry.*

pass="pass:test"

c1removeprot() {
  cn="$1"
  openssl rsa -in $cn.key -passin "$pass" -out $cn.key.unprot
  mv -f $cn.key.unprot $cn.key
}

c1genrsa() {
  cn="$1"
  subj="/CN=$cn/O=ngena.com" 
  rm -f $cn.*
  openssl genrsa -des3 -out $cn.key -passout "$pass" 2048
  c1removeprot $cn
  openssl req -new -key $cn.key -passin "$pass" -subj "$subj" -out $cn.csr 
  openssl x509 -req -days 365 -in $cn.csr -out $cn.cert -signkey $cn.key -passin "$pass"
  openssl x509 -req -days 365 -in $cn.csr -out $cn.cert -passin "$pass" -CA ca.cert -CAkey ca.key -CAcreateserial -days 365 # -signkey ca.key
  rm $cn.csr
  openssl x509 -text -in $cn.cert | grep 'Issuer:\|Subject:'
  ls -l $cn.*
}

c0rsync() {
  dest=/var/keyserver/certs
  [ -d $dest ] || exit 1
  echo; echo "## rsync server key and cert to $dest"
  ls -l ca.* server.* 
  mkdir -p $dest
  rsync -a ca.* server.* $dest
  echo; echo "## $dest"
  ls -l $dest
  echo
  pwd
  ls -l 
}

c0gen() {
  c1genrsa ca
  c1genrsa server
  c1genrsa evan
  c1genrsa brent
  c1genrsa henry
  c1removeprot server
  c0rsync
}

c0gen



cd certs || exit 

subj_ca="/CN=ca/O=ngena.com" # C=ZA/ST=WP/L=CPT/
subj_server="/CN=server/O=ngena.com" # C=ZA/ST=WP/L=CPT/
pass="pass:test"

  rm -f ca.* server.*

  rm -f ca.key ca.csr ca.crt
  openssl genrsa -des3 -out ca.key -passout "$pass" 2048
  openssl req -new -key ca.key -passin "$pass" -subj "$subj_ca" -out ca.csr 
  openssl x509 -req -days 365 -in ca.csr -out ca.crt -signkey ca.key -passin "$pass"
  rm -f ca.csr

  rm -f server.key server.csr
  openssl genrsa -des3 -out server.key -passout "$pass" 2048
  openssl req -new -key server.key -passin "$pass" -subj "$subj_server" -out server.csr

  mv server.key server.key.protected
  openssl rsa -in server.key.protected -passin "$pass" -out server.key
  rm -f server.key.protected

  rm -f server.cert
  openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.cert
  rm -f server.csr

  ls -l 

  mkdir -p /var/mobi/certs/keyserver
  rsync -a server.* /var/mobi/certs/keyserver/.
  echo '/var/mobi/certs/keyserver'
  ls -l /var/mobi/certs/keyserver


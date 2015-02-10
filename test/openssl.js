

var childProcess = require('child_process');

function generateKey(password, next) {
   openssl = childProcess.exec('openssl aes-256-cbc -P -md sha -pass stdin', function (error, stdout, stderr) {
      if (error) {
      } else if (stderr) {
      } else {
         var lines = stdout.split('\n');
         console.log(lines);
         if (lines.length >= 2 && lines[0].indexOf('key=') === 0 && lines[1].indexOf('iv=') === 0) {

         }
      }
   });
   openssl.stdin.setEncoding = 'utf-8';
   openssl.stdin.write(password);
   openssl.stdin.end();
}

generateKey('testing');

//openssl aes-256-cbc -K AE2B1FCA515949E5D54FB22B8ED9557560803B21485B1855BAB24C81578E7E2F 
//-iv 3E9A715FA80A1003AFFBF0ADA696D03E -in /etc/passwd -a 
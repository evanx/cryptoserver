

var openssl = require('openssl-wrapper');
var password = 'github';

openssl.exec('genrsa', {des3: true, passout: 'pass:' + password, '2048': false}, function(err, buffer) {
    console.log(buffer.toString());
});

// openssl aes-256-cbc -K AE2B1FCA515949E5D54FB22B8ED9557560803B21485B1855BAB24C81578E7E2F -iv 3E9A715FA80A1003AFFBF0ADA696D03E -in /etc/passwd -a 
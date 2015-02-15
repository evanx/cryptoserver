# keyserver - a dual-control crypto server in Node.js

We generate a symmetric encryption key protected by a "split knowledge" secret, and requiring "dual control" to load the key, as per the PCI DSS. Incidently, I'm deliberately using the word "secret" rather than "password," because the PCI DSS requires that "passwords" be changed every 90 days ;)

This is a Node.js re-implementation and extension of a previous <a href="https://github.com/evanx/dualcontrol">dualcontrol</a> Java implementation, as discussed in 
my <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article. 

As of 15 February 2015, this is an incomplete work-in-progress.

It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encrypted data and its encryption keys. Encryption keys are protected by split-knowledge secrets, hashed with PDKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/keyserver/blob/master/lib/app_keyserver.js">lib/app_keyserver.js</a>.

## testing 

First generate certs using openssl: [test/scripts/certGen.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/certGen.sh)

Then run the test script: [test/scripts/test.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">`https://localhost:8443/help`</a> in your browser. Actually this should just render this `README.md.` Incidently any connection without a cert client, is redirected to `/help.`


We send the following client-authenticated HTTPS requests to generate a DEK.

```shell
GET genkey/testdek/3 as evan
POST secret/testdek as evan with data 'eeeeee'
POST secret/testdek as henry with data 'hhhhhh'
POST secret/testdek as brent with data 'bbbbbb'
```

where we have three custodians submitting new secrets for a new key named `testdek.`

Incidently, if we configure for a production environment, then we validate the "password complexity" when custodians submit secrets for key generation. It should contain digits, uppercase, lowercase and punctuation, and be at least 12 characters long.

```shell
$ echo bbbbbb | curl -s -k -d @- https://localhost:8443/secret/testdek \
    --key tmp/certs/brent.key --cert tmp/certs/brent.cert
{"message":"insufficient complexity"}
```

The following illustrates a data-encrypting key (DEK) saved in Redis, protected by multiple custodians using split-knowledge secrets. The concatenated clear-text secrets of each duo of custodians is used to derive their key-encrypting key (KEK) using PBKDF2. For example, the concatenated secret for the `brent:evan` duo is `bbbbbb:eeeeee` in clear-text. 

```shell
$ redis-cli keys 'dek:*'
1) "dek:testdek"

$ redis-cli hkeys dek:testdek
1) "dek:brent:henry"
2) "dek:brent:evan"
3) "dek:evan:henry"
4) "salt"
5) "iv"

$ redis-cli redis hget dek:testdek dek:brent:evan
"8b4ed0ab35ccf9fdd6da54de34"

$ redis-cli redis hget dek:testdek dek:brent:henry
"af85a720e662a80ceacd76a318"

$ redis-cli redis hget dek:testdek dek:evan:henry
"3c901b9862be07ee80a66b365f"
```

The field `dek:brent:evan` et al is the encrypted DEK using AES with a 256bit key length. It complies with the PCI DSS as follows. It is encrypted using a KEK that is derived using the <i>split knowledge</i> of two custodians. Two custodians are required to decrypt the key, hence <i>dual control.</i> Clearly the DEK is "known to no single person" (in clear-text). 

For the key generation procedure for a new DEK, the salt for PBKDF2, the initialisation vector (IV) for AES, and the DEK itself, are generated using `crypto.randomBytes` - see 
our [lib/cryptoUtils.js](https://github.com/evanx/keyserver/blob/master/lib/cryptoUtils.js) and [lib/GenerateKe.jsy](https://github.com/evanx/keyserver/blob/master/lib/GenerateKey.js).

A large number of iterations is used for PBKDF2, to make the hashing operation take much longer. This is a critical defense against brute-force attacks against a compromised encrypted DEK. I have chosen 100k iterations, which takes a few hundred milliseconds. I don't see why this couldn't be even higher for production use, since a second or two is easily tolerable for loading a key e.g. upon a server restart.

Please report any bugs to <a href="https://twitter.com/evanxsummers">@evanxsummers</a>, or indeed any comments, questions etc.


## Other resources

Wiki home: https://github.com/evanx/vellum/wiki




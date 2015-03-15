## cryptoserver - a dual-control crypto server in Node.js

We generate a symmetric encryption key protected by a "split knowledge" secret, and requiring "dual control" to load the key, as per the PCI DSS. Incidently, I'm deliberately using the word "secret" rather than "password," because the PCI DSS requires that "passwords" be changed every 90 days ;)

This is a Node.js re-implementation and extension of a previous <a href="https://github.com/evanx/dualcontrol">dualcontrol</a> Java implementation, as discussed in my <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article. 

As of 1 March, the key generation, encryption, storage, and it's decryption and loading has been implemented and is working, but encrypting and decrypting data is not yet implemented.

It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encryption keys and data. Encryption keys are protected by split-knowledge secrets, hashed with PBKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/cryptoserver/blob/master/lib/app_cryptoserver.js">lib/app_cryptoserver.js</a>.

This side project is developed as an exercise in Node crypto. As such, do not use it in production without thorough testing and review.


### testing 

First generate test certs using openssl: [scripts/certGen.sh](https://github.com/evanx/cryptoserver/blob/master/scripts/certGen.sh)

Then run the test script: [scripts/test.sh](https://github.com/evanx/cryptoserver/blob/master/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">https://localhost:8443/help</a> in your browser. Actually this should just render this `README.md.` Incidently any request without a client cert, is redirected to `/help.` Since a self-signed server certificate is used, your browser will issue an "unsafe" warning.

The test script uses `curl` to issue the following client-authenticated HTTPS requests to generate a data-encrypting key (DEK).

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
where the HTTP status code is 500. 

The following Redis CLI commands show the DEK and its metadata saved in Redis. The DEK is protected by multiple custodians using split-knowledge secrets. The concatenated clear-text secrets of each duo of custodians is used to derive their key-encrypting key (KEK) using PBKDF2.

```shell
$ redis-cli keys 'dek:*'
1) "dek:testdek"

$ redis-cli hkeys dek:testdek
1) "iterationCount"
2) "salt"
3) "algorithm"
4) "iv"
5) "dek:evan:henry"
6) "dek:brent:henry"
7) "dek:brent:evan"

$ redis-cli redis hget dek:testdek iterationCount
"100000"

$ redis-cli redis hget dek:testdek algorithm
"aes-256-ctr"

$ redis-cli redis hget dek:testdek dek:brent:evan
"NAicG0zRVAtJgixc4b8dE8aSOkcdTEmmxgPw/rTRaKY="

$ redis-cli redis hget dek:testdek dek:brent:henry
"66EV72S57Ll/DLwLmjqEKiyDpF5zE+zt0lRb1atU/uY="

$ redis-cli redis hget dek:testdek dek:evan:henry
"3OOp5h4Kyo13ZoKbpqfe6d60z1OYakQeMhlXho6vr+g="
```

The field `dek:brent:evan` et al is the DEK encrypted using AES with a 256bit key length, and base64 encoded.

It complies with the PCI DSS as follows. It is encrypted using a KEK that is derived using the <i>split knowledge</i> of two custodians. Two custodians are required to decrypt the key, hence <i>dual control.</i> Clearly the DEK is <i>"known to no single person"</i> (in clear-text). 

To hamper brute-force attacks against a compromised encrypted DEK, we ensure that each custodian's secret is sufficiently complex and long, e.g. a minimum 12 characters. Moreover, a large number of iterations is used for PBKDF2 i.e. to hash the concatenated secrets into the KEK, e.g. 100k iterations, which takes a few hundred milliseconds. This could be even higher for production use, since a second or two is easily tolerable for loading a key e.g. upon a server restart.

For the key generation procedure for a new DEK, the salt for PBKDF2, the initialisation vector (IV) for AES, and the DEK itself, are generated using `crypto.randomBytes` - see 
[lib/cryptoFunctions.js](https://github.com/evanx/cryptoserver/blob/master/lib/cryptoFunctions.js) and 
[lib/genKey.js](https://github.com/evanx/cryptoserver/blob/master/lib/genKey.js).

Please report any bugs to <a href="https://twitter.com/evanxsummers">@evanxsummers</a>, or indeed any comments, questions etc.


## Other resources

See the companion project https://github.com/evanx/cryptoserver

Wiki home: https://github.com/evanx/vellum/wiki




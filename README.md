# keyserver - a dual-control crypto server in Node.js

We generate a symmetric encryption key protected by a "split knowledge" secret, and requiring "dual control" to load the key, as per PCI DSS. Incidently, I'm deliberately using the word "secret" rather than "password," because PCI DSS requires that "passwords" be changed every 90 days ;)

This is a Node.js re-implementation and extension of a previous <a href="https://github.com/evanx/dualcontrol">dualcontrol</a> Java implementation, as discussed in 
my <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article.

It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encrypted data and its encryption keys. Encryption keys are protected by split-knowledge secrets, hashed with PDKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/keyserver/blob/master/lib/app_keyserver.js">lib/app_keyserver.js</a>.

## testing 

First generate certs using openssl: [test/scripts/certGen.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/certGen.sh)

Then run the test script: [test/scripts/test.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">`https://localhost:8443/help`</a> in your browser. Actually this should just display this `README.md` markdown file in HTML. Incidently connection without a cert client, is redirect to `/help.`

The following illustrates a data-encrypting key (DEK) saved in Redis, protected by multiple custodians using split-knowledge secrets. The concatenated clear-text secrets of a duo of custodians is used as the key-encrypting key (KEK). The split-knowledge secret is hashed using PBKDF2 with a large number of iterations, to combat brute-force attacks. The resulting hash is our KEK, and is used to encrypted the DEK using AES with a 256bit key length. 

```shell
$ redis-cli keys dek:*
1) "dek:testdek"

$ redis-cli hkeys dek:testdek
1) "secret:brent:evan"
2) "secret:brent:henry"
3) "secret:evan:henry"
4) "salt"
5) "iv"

$ redis-cli redis hget dek:testdek secret:brent:evan
"58ba7415b10fc5d8f319123358a03dbf9d826e"

$ redis-cli redis hget dek:testdek secret:brent:henry
"2c41b20e2d2f9f4752334ab4bb7596813a8cf9"

$ redis-cli redis hget dek:testdek secret:evan:henry
"25b6d6132970f58a477d45fd68b66f592cda94"
```

Incidently, the concatenated secret for `brent:evan` is `bbbbbbbbb:eeeeeeeee` in clear-text.

For the key generation procedure for a new DEK, the salt for PBKDF2, the initialisation vector (IV) for AES, and the DEK itself, are generated is `crypto.randomBytes` - see 
our [lib/cryptoUtils.js](https://github.com/evanx/keyserver/blob/master/lib/cryptoUtils.js) wrapper, and [lib/GenerateKe.jsy](https://github.com/evanx/keyserver/blob/master/lib/GenerateKey.js).

Please report any bugs to <a href="https://twitter.com/evanxsummers">@evanxsummers</a>, or indeed any comments, questions etc.


## Other resources

Wiki home: https://github.com/evanx/vellum/wiki




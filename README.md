# keyserver - a dual-control crypto server in Node.js

We generate a symmetric encryption key protected by a "split knowledge" secret, and requiring "dual control" to load the key, as per PCI DSS. Incidently, I'm deliberately using the word "secret" rather than "password," because PCI DSS requires that "passwords" be changed every 90 days ;)

This is a Node.js re-implementation and extension of a previous <a href="https://github.com/evanx/dualcontrol">dualcontrol</a> Java implementation, as discussed in 
my <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article.

It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encrypted data and its encryption keys. Encryption keys are protected by split-knowledge secrets, hashed with PDKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/keyserver/blob/master/lib/app_keyserver.js">lib/app_keyserver.js</a>.

## testing 

First generate certs using openssl: [test/scripts/certGen.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/certGen.sh)

Then run the test script: [test/scripts/test.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">`https://localhost:8443/help`</a> in your browser. Actually this should just render this `README.md.` Incidently any connection without a cert client, is redirected to `/help.`

The following illustrates a data-encrypting key (DEK) saved in Redis, protected by multiple custodians using split-knowledge secrets. The concatenated clear-text secrets of a duo of custodians is used to derive the key-encrypting key (KEK) using PBKDF2. A large number of iterations is used to make the hashing operation take as long as is tolerable, to combat brute-force attacks. The resulting hash is a KEK, which is used to encrypt the DEK (using AES with a 256bit key length). 

```shell
$ redis-cli keys dek:*
1) "dek:testdek"

$ redis-cli hkeys dek:testdek
1) "dek:brent:henry"
2) "dek:brent:evan"
3) "dek:evan:henry"
4) "salt"
5) "iv"

$ redis-cli redis hget dek:testdek dek:brent:evan
"c5e1d92301b43815f6e6f755249e9104e3b06c"

$ redis-cli redis hget dek:testdek dek:brent:henry
"96f6cc66a5b8122d6eee8550fef62f64308f10"

$ redis-cli redis hget dek:testdek dek:evan:henry
"a45872a12d9783b00f073ae68a68dc04795b7a"
```

Incidently, the concatenated secret for `brent:evan` is `bbbbbbbbb:eeeeeeeee` in clear-text. The field `dek:brent:evan` et al is the encrypted DEK. The DEK is "known to no single person" (in clear-text) as per PCI DSS requirements. It is encrypted using a KEK that is derived using the <i>split knowledge</i> of two custodians. As such two custodians are required to decrypt the key, i.e. <i>dual control.</i>

For the key generation procedure for a new DEK, the salt for PBKDF2, the initialisation vector (IV) for AES, and the DEK itself, are generated is `crypto.randomBytes` - see 
our [lib/cryptoUtils.js](https://github.com/evanx/keyserver/blob/master/lib/cryptoUtils.js) wrapper, and [lib/GenerateKe.jsy](https://github.com/evanx/keyserver/blob/master/lib/GenerateKey.js).

Please report any bugs to <a href="https://twitter.com/evanxsummers">@evanxsummers</a>, or indeed any comments, questions etc.


## Other resources

Wiki home: https://github.com/evanx/vellum/wiki




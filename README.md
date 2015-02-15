# keyserver - a dual-control crypto server in Node.js

Generate symmetric encryption keys protected by a "split knowledge" password, 
and requiring "dual control" to load the key, as per PCI DSS.

This is a Node.js re-implementation and extension of a previous <a href="https://github.com/evanx/dualcontrol">dualcontrol</a> Java implementation, as discussed in 
my <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article.

It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encrypted data and its encryption keys. Encryption keys are protected by split-knowledge passwords, hashed with PDKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/keyserver/blob/master/lib/app_keyserver.js">lib/app_keyserver.js</a>.

## testing 

First generate certs using openssl: [test/scripts/certGen.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/certGen.sh)

Then run the test script: [test/scripts/test.sh](https://github.com/evanx/keyserver/blob/master/test/scripts/test.sh)

When the app is running, you can view the URL <a href="https://localhost:8443/help">`https://localhost:8443/help`</a> in your browser. Actually this should just display this `README.md` markdown file in HTML. Incidently connection without a cert client, is redirect to `/help.`

<hr>
Home: https://github.com/evanx/vellum/wiki



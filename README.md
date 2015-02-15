# keyserver - an encryption key server in Node.js

Generate symmetric encryption keys protected by a "split knowledge" password, 
and requiring "dual control" to load the key, as per PCI DSS.

This is a re-implementation (and extension) of `dualcontrol` in Node.js. It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encrypted data and its encryption keys. Encryption keys are protected by split-knowledge passwords, hashed with PDKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/keyserver/blob/master/lib/app_keyserver.js">app_keyserver.js</a>.

Also see our <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article, which presents the fore-runner implementation in Java.



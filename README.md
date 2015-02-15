# keyserver - an encryption key server in Node.js

Generate symmetric encryption keys protected by a "split knowledge" password, 
and requiring "dual control" to load the key, as per PCI DSS.

This is a Node.js re-implementation and extension of my previous <a href="https://github.com/evanx/dualcontrol">dualcontrol</a> Java implementation, as discussed in 
my <a href="https://github.com/evanx/vellum/wiki/DualControl">Dual Control</a> article.

It provides a secure "vault" server with client-authenticated HTTPS access. It uses Redis to store encrypted data and its encryption keys. Encryption keys are protected by split-knowledge passwords, hashed with PDKDF2, and encrypted using AES.

See this app's entry point: <a href="https://github.com/evanx/keyserver/blob/master/lib/app_keyserver.js">app_keyserver.js</a>.



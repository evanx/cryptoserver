
var fs = require('fs'),
        crypto = require('crypto');
var buffersEqual = require('buffer-equal-constant-time'),
        ssh2 = require('ssh2'),
        utils = ssh2.utils,
        Server = ssh2.Server;

var pubKey = utils.genPublicKey(utils.parseKey(fs.readFileSync('tmp/user.pub')));

console.log('pubKey', pubKey.fulltype, pubKey.public);

new Server({
   privateKey: fs.readFileSync('tmp/host.key')
}, function (client) {
   console.log('Client connected!');
   client.on('authentication', function (ctx) {
      if (ctx.method === 'publickey') {
         console.log('authentication', ctx.method, ctx.username, ctx.key.data.length, pubKey.public.length,
                 ctx.key.algo === pubKey.fulltype, buffersEqual(ctx.key.data, pubKey.public));
         if (ctx.key.algo === pubKey.fulltype && buffersEqual(ctx.key.data, pubKey.public)) {
            if (ctx.signature) {
               var verifier = crypto.createVerify(ctx.sigAlgo);
               verifier.update(ctx.blob);
               if (verifier.verify(pubKey.publicOrig, ctx.signature, 'binary')) {
                  console.log('authentication accept');
                  ctx.accept();
                  return;
               }
               console.warn('authentication signature reject');
            } else {
               console.log('authentication accept');
               ctx.accept();
               return;
            }
         }
      }
      console.log('authentication reject', ctx.method, ctx.username);
      ctx.reject();
   }).on('ready', function () {
      console.log('Client authenticated!');

      client.on('session', function (accept, reject) {
         var session = accept();
         session.once('exec', function (accept, reject, info) {
            console.log('Client wants to execute: ' + inspect(info.command));
            var stream = accept();
            stream.stderr.write('Oh no, the dreaded errors!\n');
            stream.write('Just kidding about the errors!\n');
            stream.exit(0);
            stream.end();
         });
      });
   }).on('end', function () {
      console.log('Client disconnected');
   });
}).listen(2222, '127.0.0.1', function () {
   console.log('Listening on port ' + this.address().port);
});



module.exports = {
   spec: 'components-config',
   components: {
      cryptoserver: {
         loggerLevel: 'debug',
         redisUrl: 'redis://localhost:6379/13',
         redisKeyspace: 'cs',
         hostname: 'cs',
         serviceName: 'cs',
         serviceLabel: 'cs',
         port: 8443,
         location: '/',
         adminLimit: 1,
         serverKey: './tmp/certs/server.key',
         serverCert: './tmp/certs/server.cert',
         caCert: './tmp/certs/ca.cert',
         secretTimeoutSeconds: 180,
         monitorIntervalSeconds: 60
      }
   }
};

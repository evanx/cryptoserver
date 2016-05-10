
module.exports = {
   spec: 'components',
   Server: {
      loggerLevel: 'debug',
      redisUrl: 'redis://localhost:6379/13',
      redisKeyspace: 'cs',
      hostname: 'cs',
      serviceName: 'cs',
      serviceLabel: 'cs',
      port: 8443,
      location: '/',
      adminLimit: 1,
      key: './tmp/certs/server.key',
      cert: './tmp/certs/server.cert',
      caCert: './tmp/certs/ca.cert',
      secretTimeoutSeconds : 180
   }
};

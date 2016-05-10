
module.exports = {
   Server: {
      loggerLevel: 'debug',
      redisUrl: 'redis://localhost:6379/13',
      redisKeyspace: 'cs',
      hostname: 'cs',
      serviceName: 'cs',
      serviceLabel: 'cs',
      port: 8888,
      location: '/',
      certLimit: 4,
      secureDomain: false,
      adminLimit: 1,
      addClientIp: false
   }
};

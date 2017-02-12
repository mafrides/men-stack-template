'use strict';

module.exports = {
  app: {
    title: 'Your title',
    description: 'Your description',
    keywords: 'Your keywords'
  },
  mailer: {
    from: process.env.MAILER_FROM || 'defaultemail@email.com',
    options: {
      host: process.env.MAILER_HOST || 'localhost',
      port: process.env.MAILER_PORT || 3000,
      secureConnection: 'false',
      auth: {
        user: process.env.MAILER_USER || 'defaultemail@email.com',
        pass: process.env.MAILER_PASSWORD || 'emailpassword'
      },
      tls: {
        ciphers: 'SSLv3'
      }
    },
    active: process.env.SEND_MAIL || true,
    // set true for HTTPS
    secure: false
  },
  sessionCookie: {
    maxAge: 30 * 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // set true for HTTPS
    secure: false
  },
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  sessionSecret: process.env.SESSION_SECRET || 'myBigSecret'
};
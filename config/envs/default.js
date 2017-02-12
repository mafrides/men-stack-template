'use strict';

module.exports = {
  app: {
    title: 'Your title',
    description: 'Your description',
    keywords: 'Your keywords'
  },
  sessionCookie: {
    maxAge: 30 * 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // turn this on for security when HTTPS is enabled
    secure: false
  },
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  sessionSecret: process.env.SESSION_SECRET || 'myBigSecret'
};
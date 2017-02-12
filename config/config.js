'use strict';

var path = require('path'),
  utils = require(path.resolve('./config/utils')),
  env = process.env.NODE_ENV || 'development',
  defaultConfig = require(path.resolve('./config/envs/default')),
  envConfigPaths = {
    development: './config/envs/development',
    production: './config/envs/production',
    default: './config/envs/development'
  },
  envConfig = require(path.resolve(envConfigPaths[env] || envConfigPaths.default)),
  config = utils.merge(defaultConfig, envConfig);

module.exports = config;

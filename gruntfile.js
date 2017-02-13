'use strict';

module.exports = function (grunt) {
  var jsLintPaths = ['gruntfile.js', 'server.js', 'app/**/*.js', 'app/*.js', 'config/**/*.js', 'config/*.js', 'pages/public/js/*.js'];

  grunt.initConfig({
    jshint: {
      all: {
        src: jsLintPaths,
        options: {
          jshintrc: true,
          node: true
        }
      }
    },
    eslint: {
      options: {},
      target: jsLintPaths
    },
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      all: {
        src: ['pages/public/css/*.css']
      }
    }
  });

  // Load NPM tasks
  require('load-grunt-tasks')(grunt);

  // Lint CSS and JavaScript files.
  grunt.registerTask('lint', ['jshint', 'eslint', 'csslint']);
};

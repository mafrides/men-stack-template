'use strict';

function deepClone (a) {
  if (Array.isArray(a)) {
    return a.map(function (element) { return deepClone(element); });
  } else if (typeof a === 'object') {
    return Object.keys(a).reduce(function (acc, key) {
      acc[key] = deepClone(a[key]);
      return acc;
    }, {});
  } else {
    return a;
  }
}

exports.deepClone = deepClone;

// @params arguments 1 or more Objects
// fields from subsequent objects overwrite initial object
// all objects are cloned
function merge (a) {
  var result = deepClone(a);

  Array.prototype.slice.call(arguments, 1).forEach(function (object) {
    Object.keys(object).forEach(function (key) {
      result[key] = deepClone(object[key]);
    });
  });

  return result;
};

exports.merge = merge;

// error logging with stack trace
exports.getErrorMessage = function (err) {
  var message = '';

  console.error('error:', err);
  console.error(new Error().stack);

  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        break;
      default:
        message = 'Something went wrong';
    }
  } else if (err.errors) {
    for (var errName in err.errors) {
      if (err.errors[errName].message) {
        message = err.errors[errName].message;
      }
    }
  } else if (err.message) {
    message = err.message;
  }

  return message || (err && JSON.stringify(err)) || 'Something went wrong';
};
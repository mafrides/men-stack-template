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
module.exports = exp

var env = require('booking/env');

/**
* Setup an experiment
*
* Usage:
*
*  require('booking/exp')(abc)
*
*/
function exp(name) {
  var expriment = {
    name: name,
    hash: name  // add alias
  };
  env.expriments[name] = expriment;
}

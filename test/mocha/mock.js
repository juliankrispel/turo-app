var Calculator = require('../domless-test-driver');

function Evt (value, type) {
  this.target = {
    value: value,
    dataset: {
      type: type
    },
    classList: {
      remove: function remove () {},
      add: function add () {}
    }
  };
}
function translate (input) {

  var keys = Calculator.keys,
      keyObj;

  var shim = {
    '+': 'plus',
    '-': 'minus',
    '/': 'divide',
    '*': 'times',
    '.': 'point',
    'e': 'exponent'
  };

  if (typeof input === 'number' && input < 10 && input >= 0) {
    keyObj = keys['_' + input];
  } else if (shim[input]) {
    keyObj = keys[shim[input]];
  } 
  if (!keyObj) {
    throw new Error('Bad input to translate: ' + input.toString());
  }
  

  return keyObj;
}

// DSL
// Factory pattern
function Start () {
  if (this === global) return new Start();
  this.clear();
}

Start.prototype = {
  press: function press (input) {
    if ('C='.split('').indexOf(input) > -1) {
      if (input === '=') {
        Calculator.enter();
      } else {
        this.clear();
      }
    } else {
      Calculator.type(translate(input));
    }
    return this;
  },
  clear: function clear () {
    Calculator.clear();
  }
};

Object.defineProperty(Start.prototype, 'end', {
  get: function end () {
    return Calculator.result || '0';
  }
});
module.exports = Start;


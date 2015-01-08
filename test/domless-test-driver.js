var test = require('tap').test,
    _ = require('underscore'),
    applicationObject = require('../lib/app/turo-application');



var KEYS = {},
    k = KEYS;

// calcKey is the value of the x-turo-button(?) value attribute.
//   - current implementation inserts value straight into the expression.
// type is the token type. 'digit', 'prefixOp', 'multOp', 'addOp'
//   - type. this comes, indirectly, from token names defined in the parser.
//   - The ui should be using this type info to stop the user from falling into an error
//   - recovery nightmare hellhole.
//   - These tests will not have any such safe guards.
//   - Current implementation only uses prefixOp, parensOpen, digits, variable.
//   - 
// jsKey is so we can refer to them later on in the tests e.g. k._1, k.plus, k._2.
//   - if it is not provided, it defaults to calcKey

var addKey = function (calcKey, type, jsKey, event) {
  var ret = {
    key: calcKey,
    type: type,
    _testdriver_eventType: event || 'writerPressed'
  };
  switch (type) {
    case 'unit': 
      ret.shortType = 'm';
      break;
  }
  KEYS[jsKey || calcKey] = ret;
  return ret;
};

for (var i=0; i<10; i++) {
  addKey(''+i, 'digits', '_' + i);
}

function chip(string, cursorPosition) {
  return string.substring(0, cursorPosition) + '|' + string.substring(cursorPosition);
}


var none,
    addOp = 'plusMinus',
    multOp = 'multiplyDivide',
    prefixOp = 'prefixOp',
    postfixOp = 'postfixOp',
    variable = 'variable',
    exponent = 'exponent',
    openParens = 'openParens',
    point = 'point',
    unit = 'unit',
    unitIn = 'unitIn',
    closeParens = 'closeParens';


addKey('+', addOp, 'plus');
addKey('-', addOp, 'minus');
addKey('*', multOp, 'times');
addKey('/', multOp, 'divide');
addKey('pi', variable);
addKey('sin(', prefixOp, 'sin');
addKey('cos(', prefixOp, 'cos');
addKey('!', postfixOp, 'fact');
addKey('e', exponent, exponent);
addKey('(', openParens, openParens);
addKey(')', closeParens, closeParens);
addKey('.', point, point);
addKey('/', 'unitPer', 'unitPer');
addKey('^', 'unitPower', 'unitPower');
addKey('m', unit, 'm');
addKey('km', unit, 'km');
addKey('kg', unit, 'kg');
addKey(' in ', unitIn, 'unitIn');
addKey('tonne', unit, 'tonne');
addKey('backspace', none, none, 'deletePressed');
addKey('enter', none, none, 'enterPressed');


function defineSetters (obj, methodToProp) {
  _.each(methodToProp, function (i, methodName) {
    var prop = methodToProp[methodName];
    obj[methodName] = function (arg) {
      this[prop] = arg;
    };
  });
  return obj;
}

function createApplication () {
  // This will suffice for now, however, we should be moving to 
  // $native being run by functions or at least work out a way of allowing js to native property setting in kirin.
  var $keyboard = {},
      $editorDisplay = {},
      $calculator = {};

  defineSetters($keyboard, {
    displayVariables: 'variables',
    displayButtonEnablement: 'layout',
    displayHasUnits: 'hasUnits',
    displayAnswer: 'answer',
    displayUnits: 'units',
  });

  defineSetters($editorDisplay, {
    displayAnswer: 'answer',
    displayStatement: 'statement',
  });


  var CalculatorController = require('../lib/app/calculator-controller'),
      EditorDisplayController = require('../lib/app/editor-display-controller'),
      KeyboardController = require('../lib/app/keyboard-controller');

  var app = {
    calculator_controller: new CalculatorController($calculator),
    editor_display_contoller: new EditorDisplayController($editorDisplay),
    keyboard_controller: new KeyboardController($keyboard),
    $editorDisplay: $editorDisplay,
    $keyboard: $keyboard,
    $calculator: $calculator,
  };
  

  app.calculator_controller.onResume();
  app.editor_display_contoller.isUnderTest = true;

  return app;
}




var API = {
  keys: KEYS,
  state: createApplication(),
  
  reset: function () {
    applicationObject.reset();
    return this;
  },

  type: function (keys) {
    var self = this;
    if (!_.isArray(keys)) {
      keys = _.toArray(arguments);
    }
    _.each(keys, function (keyObj) {
      var eventName = keyObj._testdriver_eventType;
      if (eventName) {
        return self.state.keyboard_controller[eventName](keyObj);
      }
    });
    return this;
  },

  clear: function () {
    this.state.keyboard_controller.clearPressed();
    return this;
  },

  enter: function () {
    this.state.keyboard_controller.enterButtonPressed();
    return this;
  },

  delete: function (num) {
    if (typeof num !== 'number') {
      num = 1;
    } 
    for (var i=0; i<num; i++) {
      this.state.keyboard_controller.deletePressed();
    }
    return this;
  },

  moveCursor: function (to) {
    // if type to !== number, send to back?
    this.state.editor_display_contoller.moveCursor(to);
    return this;
  },

  moveCursorBy: function (offset) {
    return this.moveCursor(this.cursor + offset);
  },

  testCursor: function (t, expected) {
    if (expected === undefined) {
      expected = this.expression.length;
    }
    if (expected < 0) {
      expected = this.expression.length + expected; 
    }
    t.isEqual(this.cursor, expected, 'Cursor: "' + chip(this.expression, this.cursor) + '" = "' + chip(this.expression, expected) + '"');
    return this;
  },

  testExpression: function (t, expected) {
    t.isEqual(this.expression, expected, this.expression + ' = ' + expected);
    return this;
  },

  testResult: function (t, expected) {
    t.isEqual(this.result, expected, this.expression + ' = ' + expected);
    return this;
  }

};

Object.defineProperties(API, {
  expression: {
    get: function () {
      return this.state.$editorDisplay.statement.expressionToString;
    },
  },

  result: {
    get: function () {
      return this.state.$editorDisplay.statement.resultToString;
    }
  },

  cursor: {
    get: function () {
      return this.state.$editorDisplay.statement.cursorPosition;
    },
    set: function (newValue) {
      console.error('moverCursor to ' + chip(this.expression, newValue));
      this.state.$editorDisplay.statement.cursorPosition = newValue;
    }
  }
});

module.exports = API;

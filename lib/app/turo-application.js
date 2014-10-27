var application = {};

Object.defineProperties(application, {
});

function lazyGetter (property, fn) {
  var propertyName = '_' + property;
  Object.defineProperty(application, property, {
    get: function () {
      var instance = this[propertyName];
      if (!instance) {
        this[propertyName] = instance = fn.apply(this, arguments);
      }
      return instance;
    },

    set: function (value) {
      this.reset();
      this[propertyName] = value;
    }
  });
  
}

lazyGetter('model', function () {
  return application.calculator.model;
});

lazyGetter('calculator', function () {
  var Calculator = require('./calculator-controller');
  var c = new Calculator();
  return c;
});

lazyGetter('editor', function () {
  var c = this.calculator,
      ec = c.getEditorController();
  return ec;
});

lazyGetter('EditorDisplayController', function () {
  return require('./editor-display-controller'); 
});

lazyGetter('KeyboardController', function () {
  return require('./keyboard-controller'); 
});


// Just for testing right now.
// Hope that any duplicate applications would be in their own web-component bubble.
application.reset = function () {
  delete this._calculator;
  delete this._model;
  delete this._editor;  
  return this;
};



module.exports = application.reset();
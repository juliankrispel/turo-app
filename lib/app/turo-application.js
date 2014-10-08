var application = {};

Object.defineProperties(application, {
});

function lazyGetter (property, fn) {
  var propertyName = '_' + property;
  Object.defineProperty(application, property, {
    get: function () {
      var instance = application[propertyName];
      if (!instance) {
        application[propertyName] = instance = fn.apply(application, arguments);
      }
      return instance;
    }
  });
  
}

lazyGetter('model', function () {
  return application.calculator.model;
});

lazyGetter('calculator', function () {
  var Calculator = require('./calculator-controller');
  return new Calculator();
});

lazyGetter('editor', function () {
  return application.calculator.getEditorController();
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

  var calculator = this.calculator,
      editor = this.editor;
  calculator.initModel();
  
  return this;
};



module.exports = application.reset();
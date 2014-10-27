"use strict";

var _ = require('underscore'),
  EventEmitter = require('events').EventEmitter;

var KeyboardController = function KeyboardController($native) {
  if ($native) {
    this.onLoad($native);
    this.onResume();
  }
};

KeyboardController.prototype = new EventEmitter();

_.extend(KeyboardController.prototype, {
    onLoad: function ($native) {
      this.$native = $native;

      var application = require('./turo-application');
      this.editor = application.editor;
      var variables = application.model.turo.variables;

      var variableNames = _.chain(variables.definitions).keys().filter(function (k) {
        return variables.getVariableDefinition(k).isConstant;
      }).value();
      this.$native.variables = variableNames;
      this.editor.$keyboard = this;
    },

    onResume: function () {
      // XXX this shouldn't be done here.
      // TODO make calculator-controller a full blown module, with a lifecycle.
    },

    onUnload: function () {
      this.editor = null;
    },

    writerPressed: function (e) {
      this.editor.writerPressed(e);
    },

    clearPressed: function (e) {
      this.editor.clearPressed(e);
    },

    enterButtonPressed: function (e) {
      this.editor.enterButtonPressed(e);
    },

    deletePressed: function (e) {
      this.editor.deletePressed(e);
    }
    
  });

Object.defineProperties(KeyboardController.prototype, {
  layout: {
    set: function (_layout) {
      this.$native.layout = _layout;
    }
  },
  hasUnits: {
    set: function (_hasUnits) {
      this.$native.hasUnits = _hasUnits;
    }
  },
  answer: {
    set: function (ans) {
      this.$native.answer = {
        resultToString: ans.valueToString(),
        resultToHtml: ans.valueToHtml({
          precisionType: "sf", 
          precisionDigits: 6,
          useUnitRefactor: true,
          exponent: true, 
          prettyPrint: true
        }),
      };
    }
  }
});

module.exports = KeyboardController;
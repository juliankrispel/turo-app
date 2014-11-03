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
      
      var calc = require('./turo-application').calculator;
      
      var turo = calc.model.turo;

      // Tell the keyboard about constants.
      {
        var variables = turo.variables;

        var variableNames = _.chain(variables.definitions).keys().filter(function (k) {
          return variables.getVariableDefinition(k).isConstant;
        }).value();
        this.$native.displayVariables(variableNames);
      }
      

      // Tell the keyboard about units.
      {
        var unitSchemes = turo.units.unitSchemes;
        var unitMap = {
          schemes: unitSchemes.getUnitSchemes(),
          units: {},
        };
        var dimensions = [];
        _(unitMap.schemes).each(function(schemeName){
          console.log('Unit scheme ' + schemeName);
          unitMap.units[schemeName] = {};

          _(unitSchemes.getDimensions(schemeName)).each(function(dimensionName){
            unitMap.units[schemeName][dimensionName] = unitSchemes.getUnitNames(schemeName, dimensionName);
            dimensions.push(dimensionName);
          });
        });

        unitMap.dimensions = _.uniq(dimensions);
        this.$native.displayUnits(unitMap);
      }

      

      this.editor = calc.getEditorController();
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

    clearPressed: function () {
      this.editor.clearPressed();
    },

    enterButtonPressed: function () {
      this.editor.enterButtonPressed();
    },

    deletePressed: function () {
      this.editor.deletePressed();
    }    
  }
);



Object.defineProperties(KeyboardController.prototype, {
  layout: {
    set: function (_layout) {
      this.$native.displayButtonEnablement(_layout);
    }
  },
  hasUnits: {
    set: function (_hasUnits) {
      this.$native.displayHasUnits(_hasUnits);
    }
  },
  answer: {
    set: function (ans) {
      this.$native.displayAnswer({
        resultToString: ans.valueToString(),
        resultToHtml: ans.valueToHtml({
          precisionType: "sf", 
          precisionDigits: 6,
          useUnitRefactor: true,
          exponent: true, 
          prettyPrint: true
        }),
      });
    }
  }
});

module.exports = KeyboardController;
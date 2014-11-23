"use strict";

var _ = require('underscore'),
  application = require('./turo-application'),
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
      
      var calc = application.calculator;
      
      var turo = calc.model.turo;
      
      this.model = calc.model;
      
      this.prefs = turo.prefs();

      // Tell the keyboard about constants.
      {
        var variables = turo.variables;

        var variableNames = _.chain(variables.definitions).keys().filter(function (k) {
          return variables.getVariableDefinition(k).isConstant;
        }).value();
        this.$native.displayVariables(variableNames);
      }
      

      // Tell the keyboard about units.
      this.requestLayoutUnits();

      this.editor = calc.getEditorController();
      this.editor.$keyboard = this;
    },

    onResume: function () {
      // NOP
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
    },

    requestLayoutUnits: function () {
      var turo = this.model.turo;
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
    },
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

  unitScheme: {
    set: function (_unitScheme) {
      this._unitScheme = _unitScheme;
    },
    get: function () {
      return this._unitScheme || null;
    }
  },

  answer: {
    set: function (ans) {
      var prefs = this.prefs;
      var valueToHtml = ans.valueToHtml({
          precisionType: "sf", 
          precisionDigits: 6,
          useUnitRefactor: true,
          exponent: true, 
          prettyPrint: true,
        });
      this.$native.displayAnswer({
        resultToString: ans.valueToString(),
        resultToHtml: valueToHtml,
        unitScheme: this.unitScheme || "",
      });
    }
  }
});

module.exports = KeyboardController;
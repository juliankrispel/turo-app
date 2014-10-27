"use strict";

var _ = require("underscore"),
  app = require('./turo-application'),
  Model = require("./model"),
  editing = require("./editing-controller"),
  application = require('./turo-application');

function Controller ($native) {
  this._editorController = new editing.Controller(this);
  application.calculator = this;
  this.initModel();
  if ($native) {
    this.onLoad($native);
  }
}

_.extend(Controller.prototype, {

  onLoad: function ($native) {
    this.$native = $native;
  },

  onResume: function () {
    var statement = this.newStatement();
    this.getEditorController().beginEditing(statement);
  },

  newStatement: function () {
    return this.model.putStatement();
  },

  getStatement: function (id) {
    return this.model.getStatementWithId(id);
  },

  getEditorController: function () {
    return this._editorController;
  },

  initModel: function () {
    var self = this;
    var m = this._newModel();
    this.turo = m.turo;
    this.model = m.include('app');
  },

  _newModel: function () {
    return new Model();
  },
});


module.exports = Controller;

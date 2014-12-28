"use strict";

var _ = require("underscore"),
  app = require('./turo-application'),
  Model = require("./model"),
  editing = require("./editing-controller"),
  application = require('./turo-application');

function Controller ($native) {
  application.calculator = this;
  this.initModel();
  this._editorController = new editing.Controller(this);
  if ($native) {
    this.onLoad($native);
  }
}

_.extend(Controller.prototype, {

  onLoad: function ($native) {
    this.$native = $native;
  },

  onUnload: function () {
    this.$native = null;
  },

  onResume: function () {
    var statement = this.statement;
    if (!statement) {
      this.statement = statement = this.newStatement();
      this.getEditorController().beginEditing(statement);
    } else {
      this.getEditorController().refreshUi();
    }
  },

  onPause: function () {
    // NOP
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

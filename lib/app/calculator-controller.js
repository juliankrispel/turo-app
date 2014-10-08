"use strict";

var _ = require("underscore"),
  app = require('./turo-application'),
  Model = require("./model"),
  editing = require("./editing-controller");

function Controller () {
  this._editorController = new editing.Controller(this);
}

_.extend(Controller.prototype, {

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
    return;
    
  },

  _newModel: function () {
    return new Model();
  },
});


module.exports = Controller;

module.exports = {
  namespace: 'io.turo.generated',
  classes: {

    ///////////////////////////////////////////////////////////////
    // The Editor Display
    ///////////////////////////////////////////////////////////////
    'DocumentEditor': {
      implementedBy: 'native',
      methods: { 
        // only methods allowed
        setLineRangeOfInterest: [{start:'int'}, {end:'int'}], 
        requestDocument: [],
        replaceStyledLines: [{start:'int'}, {end:'int'}, {lines:'string'}],
        replaceAllLines: [{stringDoc: 'string'}],
        displayAutoComplete: [{tokens:'array'}], // TODO transferable autocomplete choice.
        displayErrors: [{errors:'array'}], // TODO transferable error.
      }
    },

    'DocumentEditorController': {
      alias: 'document-editor-controller',
      implementedBy: 'javascript', // || gwt
      methods: {
        onStatementChange:[{statement:'string'}, {cursorPosition:'int'}],
        onDocumentChange:[{document:'string'}, {cursorPosition:'int'}],
        onCursorLineChange:[{newLineNo:'int'}, {cursorPosition:'int'}],
        requestAutoComplete:[{cursorPosition:'int'}],
      }
    },
    
  }
};
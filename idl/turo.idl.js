module.exports = {
  namespace: 'io.turo.generated',
  classes: {
    'EditorDisplay': {
      implementedBy: 'native',
      methods: { 
        // only methods allowed
        displayStatement: [{statement: 'TransferableStatement'}], 
        displayCursorPosition: [{position: 'integer'}]
      }
    },

    'EditorDisplayController': {
      alias: 'editor-display-controller',
      implementedBy: 'javascript', // || gwt
      methods: {
        beginEditingIdentifier: [],
        beginEditingExpression: [],
      }
    },
    
    'TransferableStatement': {
      role: 'request',
      properties: { 
        id: 'string',
        expressionToString: 'string',
        autoSuffix: 'string',
        identifierToString: 'string',
        expressionErrorToString: 'string',
        identifierErrorToString: 'string',
        resultToString: 'string',
      },

      validation: {
        mandatory: ['id', 'expressionToString' ],
        // acceptableForms: [
        //   [… array of property names…]
        // ]
        // defaults: {

        // },
      }
    },
    
    'Keyboard': {
      implementedBy: 'native',

      methods: {
        displayButtonEnablement: [{tokenTypeSet: 'object'}],
        displayVariables: [{variables: 'array'}],
        displayHasUnits: [{hasUnits: 'boolean'}],
        displayAnswer: [{answer: 'TransferableAnswer'}] 
      }
    },

    'TransferableAnswer': {
      role: 'request',
      properties: { 
        resultToHtml: 'string',
        resultToString: 'string',
      }
    },

    'KeyboardController': {
      implementedBy: 'javascript',
      alias: 'keyboard-controller',
      methods: {
        writerPressed: [{t: 'TransferableKeypress'}],
        clearPressed: [{t: 'TransferableKeypress'}],
        enterButtonPressed: [{t: 'TransferableKeypress'}],
        deletePressed: [{t: 'TransferableKeypress'}],
      }
    },

    'TransferableKeypress': {
      role: 'response',
      properties: { 
        key: 'string',
        classList: 'array', // of strings
      }  
    }
  }
};
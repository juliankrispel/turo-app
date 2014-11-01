module.exports = {
  namespace: 'io.turo.generated',
  classes: {
    'EditorDisplay': {
      implementedBy: 'native',
      methods: { 
        // only methods allowed
        displayStatement: [{statement: 'TransferableStatement'}], 
      }
    },

    'EditorDisplayController': {
      alias: 'editor-display-controller',
      implementedBy: 'javascript', // || gwt
      methods: {
        beginEditingIdentifier: [],
        beginEditingExpression: [],
        moveCursor:[{position:'int'}],
        cycleUnitScheme: [],
      }
    },
    
    'TransferableStatement': {
      role: 'request',
      properties: { 
        id: 'string',
        expressionToString: 'string',
        expressionLength: 'int',
        expressionIsString: 'boolean',
        autoSuffix: 'string',
        identifierToString: 'string',
        expressionErrorToString: 'string',
        identifierErrorToString: 'string',
        resultToString: 'string',
        cursorPosition: 'int',
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
        displayButtonEnablement: [{tokenTypeSet: 'array'}],
        displayVariables: [{variables: 'array'}],
        displayHasUnits: [{hasUnits: 'boolean'}],
        displayUnits: [{units: 'object'}],
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
        clearPressed: [],
        enterButtonPressed: [],
        deletePressed: [],
      }
    },

    'TransferableKeypress': {
      role: 'response',
      properties: { 
        type: 'string', // the token type
        key: 'string', // the key literal
      }  
    },

    'Calculator': {
      implementedBy: 'native',
      methods: {
      }
    },

    'CalculatorController': {
      implementedBy: 'javascript',
      alias: 'calculator-controller',
      methods: {
      }
    },
  }
};
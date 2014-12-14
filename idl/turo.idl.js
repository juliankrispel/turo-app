module.exports = {
  namespace: 'io.turo.generated',
  classes: {

    ///////////////////////////////////////////////////////////////
    // The Editor Display
    ///////////////////////////////////////////////////////////////
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
        setEditorColors: [{colors: 'TransferableColors'}],
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
        unitScheme: 'string',
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
    
    'TransferableColors': {
      role: 'response',
      properties: { 
        autoSuffix: 'string', // the token type
        errorNodes: 'string', // the key literal
      }  
    },

    ///////////////////////////////////////////////////////////////
    // The Keyboard.
    ///////////////////////////////////////////////////////////////

    'Keyboard': {
      implementedBy: 'native',

      methods: {
        displayButtonEnablement: [{tokenTypeSet: 'array'}],
        displayVariables: [{variables: 'array'}],
        displayHasUnits: [{hasUnits: 'boolean'}],
        displayUnits: [{units: 'TransferableUnitsData'}],
        displayAnswer: [{answer: 'TransferableAnswer'}] 
      }
    },

    'TransferableAnswer': {
      role: 'request',
      properties: { 
        resultToHtml: 'string',
        resultToString: 'string',
        unitScheme: 'string',
      }
    },

    'TransferableUnitsData': {
      role: 'request',
      properties: { 
        // scheme: { dimension: [unit1, unit2] }
        units: 'object',
        schemes: 'array',
        dimensions: 'array',
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

        requestLayoutUnits: [],
      }
    },

    'TransferableKeypress': {
      role: 'response',
      properties: { 
        type: 'string', // the token type
        key: 'string', // the key literal
      }  
    },

    ///////////////////////////////////////////////////////////////
    // The Editor.
    ///////////////////////////////////////////////////////////////

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
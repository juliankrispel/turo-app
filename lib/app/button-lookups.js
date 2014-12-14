var _ = require("underscore"),
    lookups = {

  isBasic: {
    "+": true,
    "-": true,
    "/": true,
    "*": true,
    "in": true,
  },

  // maps the operator literal's name to the keyboard button's label.
  labels: {
    "square": "x^2",
    "^1/x": "y√x"
  },

  // also, (not yet) used in output.toString(). Symbols should be understood by the parser, if you've added them
  prettyOutput: {
    "sqrt": "√",
    "*": "×",
    "nth_root": "√",
    "in": "in"
  },

  inputValue: {
    "in": "in",
    "sqrt": "√(",
    "square": "^2",
    "^1/x": "^(1/",
  },

  inverse: {
    "^": "^1/x",
    "sqrt": "square"
  },

  operatorType: {
    square: "infixOp",
    "^1/x": "infixOp",
  },

  // also, (not yet) used in output.toString().
  // Dummy, for easier URL encoding.
  urlOuput: {},

  prefixOperators: [],

  infixOperators: [],

  postfixOperators: [],

};

_.defaults(lookups.labels, lookups.prettyOutput);

module.exports = lookups;

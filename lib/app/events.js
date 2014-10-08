var _ = require('underscore'),
    Touchy = require('touchy'),
    trx = require('tiny-rx');

var hasClass = function(className){
  
  if (arguments.length === 1) {
    return function(e){
      return e.button.className.indexOf(className) >= 0;
    };  
  }
  
  var args = _.toArray(arguments);
  return function(e){
    return _.intersection(e.button.classList, args).length > 0;
  };
};

var getParent = function($element, attr, value) {
  while ($element && $element[attr] !== value){
    $element = $element.parentNode;
  }
  return $element;
};

var getParentWithTest = function ($element, test) {
  while ($element && !test($element)) {
    $element = $element.parentNode; 
  }
  return $element;
};

var filterTokens = function (e) {
  var $button = e.button;
  if ($button.nodeName !== 'X-TURO-TOKEN') {
    return false;
  }
  return true;
};

var keyboardTouchy = new Touchy('x-turo-keyboard');
var keyboardTaps = keyboardTouchy.taps.map(function(e){
  e.button = getParent(e.target, 'nodeName', 'BUTTON');
  if(e.button){
    return e;
  }
}).truethy();

var enter = keyboardTaps.filter(hasClass('enterButton'));

var editorTouchy = new Touchy('x-turo-editor');
var editorTaps = editorTouchy.taps.map(function (e) {
  e.button = getParentWithTest(e.target, function ($e) {
    // XXX this feels like a disgusting hack to me.
    // I'm almost wishing I had done this as a tag 'x-turo-tappable'.
    return $e.nodeName.indexOf('X-TURO-') === 0;
  });
  if(e.button){
    return e;
  }
}).truethy();

module.exports = {
  bindKeyboardEvents: keyboardTouchy.bindEvents,
  bindEditorEvents: editorTouchy.bindEvents,
  taps: keyboardTaps,
  swiper: keyboardTouchy.swiper,
  writer: keyboardTaps.filter(hasClass('writer')),
  goHome: keyboardTaps.filter(hasClass('goHome')),
  delete: keyboardTaps.filter(hasClass('delete')),
  clear: keyboardTaps.filter(hasClass('clear')),
  variables: keyboardTaps.filter(hasClass('variables')),
  variableButtons: keyboardTaps.filter(hasClass('variable')),
  operatorButtons: keyboardTaps.filter(hasClass('infixOp', 'prefixOp', 'postfixOp')),
  unitPer: keyboardTaps.filter(hasClass('unitPer')),
  unitScheme: keyboardTaps.filter(hasClass('unitScheme')),
  unitIn: keyboardTaps.filter(hasClass('unitIn')),
  dimension: keyboardTaps.filter(hasClass('dimension')),
  inverse: keyboardTaps.filter(hasClass('inverse')),
  enter: enter,
  enterButton: enter,
  currentResult: editorTaps.filter(hasClass('result')),
  unitSchemeSelector: editorTaps.filter(hasClass('unit-scheme')),
  editorTokens: editorTaps.filter(filterTokens),
};

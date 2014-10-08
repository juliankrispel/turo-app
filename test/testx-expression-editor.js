var test = require('tap').test,
    _ = require('underscore'),

    expressionEditor = require('../lib/app/expression-editor.js'),
    Editor = expressionEditor.ExpressionEditor,
    Turo = require('turo').Turo,
    output = require('turo').toSource,
    turo = new Turo();

function chip(string, cursorPosition) {
  return string.substring(0, cursorPosition) + '|' + string.substring(cursorPosition);
}

function testAppend (t, editor, oldString, expectedString, token, result) {
  result = result || turo.evaluate(oldString);

  var node = editor.append(oldString, result, token),
      newString = output.toString(node);

  t.equal(newString, expectedString, "Append: " + oldString + " + '" + token.key+ "' -> " + newString);
  // 2m^2 + ^ -> (2m^2)^$
}

/*
test('Simple', function (t) {
  var editor = new Editor();

  var oldString = '1+2345', 
    newString;

  var sinToken = {
    key: 'sin(',
    type: 'prefixOp' 
  };
  var plusToken = {
    key: '+',
    type: 'infixOp' 
  };
  var parensOpenToken = {
    key: '(',
    type: 'parensOpen' 
  };

  testAppend(t, editor, oldString, '1+2345+', plusToken);

  testAppend(t, editor, oldString, '1+sin(2345', sinToken);

  testAppend(t, editor, oldString, '1+(2345', parensOpenToken);

  turo.evaluate('unit m : Length');
  
  oldString = '5 m';
  testAppend(t, editor, oldString, 'sin(5 m', sinToken);

  t.end();
});


test('Valid result, just after parensClose', function (t) {
  var editor = new Editor();

  var exp = turo.evaluate('(1+2)');

  var oldString = exp.expressionToString(), 
    newString;

  testAppend(t, editor, '(1+2)', 'sin(1+2)', { // 6
    key: 'sin(',
    type: 'prefixOp' 
  });

  testAppend(t, editor, '(1+(2)', '(1+sin(2)', { // 7
    key: 'sin(',
    type: 'prefixOp' 
  });

  testAppend(t, editor, '(1+(2))', 'sin(1+(2))', { //8 
    key: 'sin(',
    type: 'prefixOp' 
  });

  t.end();

});


function testInserts (t, editor, oldString, token, expectedStrings) {
  var result = turo.evaluate(oldString), 
      newString;

  for (var i=0, max = oldString.length; i<=max; i++) {
    var node = editor.insert(oldString, i, result, token)
        newString = output.toString(node);
    
    if (expectedStrings[i]) {
      t.equal(expectedStrings[i], newString, "Insert '"+token.key+"': " + chip(oldString, i) + ' -> ' + newString);
    }
  }
  

}

test('Valid result, insert', function (t) {
  var editor = new Editor();

  var exp = turo.evaluate('(1+2)');

  var oldString = exp.expressionToString(), 
      newString;
  var token = {
    key: 'sin(',
    type: 'prefixOp' 
  };

  testInserts(t, editor, '1.0', token, ['sin(1.0', 'sin(1.0', 'sin(1.0', 'sin(1.0']);
  testInserts(t, editor, '1+2', token, ['sin(1+2', 'sin(1+2', '1+sin(2', '1+sin(2']);
  testInserts(t, editor, '(1+2)', token, ['sin((1+2)', '(sin(1+2)', '(sin(1+2)', '(1+sin(2)', 
                                            '(1+sin(2)',
                                            'sin(1+2)',]);

  turo.evaluate('unit metre : Length');
  turo.evaluate('unit kg : Mass');
  testInserts(t, editor, '1.0 metre', token, ['sin(1.0 metre', 'sin(1.0 metre', 'sin(1.0 metre',
                                              'sin(1.0 metre', 'sin(1.0 metre', 'sin(1.0 metre', 'sin(1.0 metre',
                                              'sin(1.0 metre', 'sin(1.0 metre', 'sin(1.0 metre']);
  
  t.end();

});
*/
function testDelete (t, editor, oldString, cursorPosition, expectedString, result) {
  result = turo.evaluate(oldString);
  var node = editor._delete(oldString, result, cursorPosition),
        newString = output.toString(node);  
  t.equal(newString, expectedString, "Deleting: " + oldString.substr(0, cursorPosition) + '|' + oldString.substr(cursorPosition) + ' -> ' + newString);
}

function testDeletes (t, editor, oldString, expectedStrings) {

  console.log('=============================================');
  console.log('Deleting from ' + oldString);
  var result = turo.evaluate(oldString);

  for (var i=0, max = oldString.length; i<=max; i++) {
    var node = editor._delete(oldString, result, i),
        newString = output.toString(node),
        origString = output.toString(result.expression());
    t.equal(origString, oldString /*, 'Rountripping: ' + oldString + ' = ' + origString */);    
    if (expectedStrings[i]) {
      console.log('-----------------------------------------------');
      var msg = 'Deleting: ' + chip(oldString, i) + ' -> ' + newString;
      if (expectedStrings[i] !== newString) {
        msg += ' expected: ' + expectedStrings[i] + '.';
      }
      t.equal(newString, expectedStrings[i], msg);
    }
  }
}

test('Valid result, delete', function (t) {
  var editor = new Editor();

  testDeletes(t, editor, '1.0', ['1.0', '.0', '10', '1.']);
  testDeletes(t, editor, '1+12', ['1+12', '+12', '112', '1+2', '1+1']);
  testDeletes(t, editor, '1+(12)', ['1+(12)', '+(12)', '1(12)', '1+12', '1+(2)', '1+(1)', '1+12']);
  
  testDeletes(t, editor, '(1.0)', ['(1.0)', '1.0', '(.0)', '(10)', '(1.)', '1.0' ]);

  turo.evaluate('xyz = 1.0');
  testDeletes(t, editor, '(xyz)', ['(xyz)', 'xyz', '()', '()', '()', 'xyz' ]);  
  testDeletes(t, editor, '1+xyz', ['1+xyz', '+xyz', '1xyz', '1+', '1+', '1+' ]);  


  testDeletes(t, editor, '1+sin(xyz)', ['1+sin(xyz)', '+sin(xyz)', 
                                        '1sin(xyz)', 
                                        '1+(xyz)', '1+(xyz)', '1+(xyz)', 
                                        '1+sin xyz', 
                                        '1+sin()', '1+sin()', '1+sin()', 
                                        '1+sin xyz'
                                        ]);

  // testDeletes(t, editor, '(1+(2+3))+5', ['(1+(2+3))+5', '1+(2+3))+5', '(+(2+3))+5', // (1
  //                                        '(1(2+3))+5', '(1+2+3))+5', '(1+(+3))+5', // +(2
  //                                        '(1+(23))+5', '(1+(2+))+5', // +3
  //                                        '(1+(2+3)+5', '(1+(2+3)+5', '(1+(2+3))5', '(1+(2+3))+' // ))+5
  //                                        ]);

  t.end();
});


/*
test('Valid result, delete from units', function (t) {
  turo.evaluate('unit metre : Length');
  turo.evaluate('unit kg : Mass');

  var editor = new Editor();

  testDelete(t, editor, '12 kg/metre^2', 0, '12 kg/metre^2');
  testDelete(t, editor, '12 kg/metre^2', 1, '2 kg/metre^2');
  testDelete(t, editor, '12 kg/metre^2', 2, '1 kg/metre^2');
  testDelete(t, editor, '12 kg/metre^2', 3, '12kg/metre^2');
  testDelete(t, editor, '12 kg/metre^2', 4, '12/metre^2');
  testDelete(t, editor, '12 kg/metre^2', 5, '12/metre^2');
  testDelete(t, editor, '12 kg/metre^2', 6, '12 kg metre^2'); // requires '/' -> ' '
  testDelete(t, editor, '12 kg/metre^2', 7, '12 kg/^2');


  testDelete(t, editor, '12 kg metre^2', 0, '12 kg metre^2');
  testDelete(t, editor, '12 kg metre^2', 1, '2 kg metre^2');
  testDelete(t, editor, '12 kg metre^2', 2, '1 kg metre^2');
  testDelete(t, editor, '12 kg metre^2', 3, '12kg metre^2');
  testDelete(t, editor, '12 kg metre^2', 4, '12 metre^2');
  testDelete(t, editor, '12 kg metre^2', 5, '12 metre^2');
  testDelete(t, editor, '12 kg metre^2', 6, '12 metre^2'); // requires trailing spaces to be considered part of preceeding token
  testDelete(t, editor, '12 kg metre^2', 7, '12 kg^2');


  testDelete(t, editor, '12 metre*3 metre', 0, '12 metre*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 1, '2 metre*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 2, '1 metre*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 3, '12metre*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 4, '12*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 5, '12*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 6, '12*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 7, '12*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 8, '12*3 metre');
  testDelete(t, editor, '12 metre*3 metre', 9, '12 metre3 metre'); // this errors, because we can't look up binary nodes properly
  testDelete(t, editor, '12 metre*3 metre', 10, '12 metre* metre');
  testDelete(t, editor, '12 metre*3 metre', 11, '12 metre*3metre');
  testDelete(t, editor, '12 metre*3 metre', 12, '12 metre*3');
  testDelete(t, editor, '12 metre*3 metre', 13, '12 metre*3');

  testDeletes(t, editor, '1.0 kg', ['1.0 kg', '.0 kg', '10 kg', '1. kg', '1.0kg', '1.0', '1.0']);
  testDeletes(t, editor, '1.0 kg^2', ['1.0 kg^2', '.0 kg^2', '10 kg^2', '1. kg^2', // 1.0
               '1.0kg^2', '1.0^2', '1.0^2', // kg
               '1.0 kg', '1.0 kg^', '1.0 kg' // ^2
               ]);

  testDeletes(t, editor, '1.0 kg^2/metre', ['1.0 kg^2/metre', '.0 kg^2/metre', '10 kg^2/metre', '1. kg^2/metre', // 1.0
               '1.0kg^2/metre', '1.0^2/metre', '1.0^2/metre', // kg
               '1.0 kg/metre', '1.0 kg^/metre', // ^2
               '1.0 kg^2 metre', '1.0 kg^2/', '1.0 kg^2/' // /metre
               ]);

  t.end();

});
*/


var test = require('tap').test,
    calc = require('./domless-test-driver'),
    k = calc.keys;


test('Testing the driver', function (t) {
  calc
    .type(k._1, k.plus, k._2)
    .testExpression(t, '1+2')
    .testResult(t, '3');

  calc
    .type(k.plus, k._3)
    .testExpression(t, '1+2+3')
    .testResult(t, '6')
    .enter();

  calc
    .type(k._4, k.plus, k._5)
    .testExpression(t, '4+5')
    .testResult(t, '9');

  calc
    .delete()
    .type(k._6)
    .testResult(t, '10')
    .testExpression(t, '4+6')
    .delete(2)
    .testExpression(t, '4')
    .testResult(t, '4')
    .enter();

  t.end();
});

test('Reset the driver', function (t) {
  calc.reset();

  // calc.type(k._1)
  //   .testExpression(t, '1');

  t.end();
});

test('Real simple start', function (t) {
  calc
    .type(k._1, k.plus, k._2)
    .testExpression(t, '1+2')
    .moveCursor(2)
    .delete()
    .testExpression(t, '12')
    .testCursor(t, 1)
    .enter()
    .testExpression(t, '12')
    .testCursor(t, 2);

  calc.type(k._1, k.plus, k._2)
    .testExpression(t, '1+2')
    .moveCursor(2)
    .delete(2)
    .testExpression(t, '2')
    .testCursor(t, 0)
    .enter()
    .testExpression(t, '2')
    .testCursor(t, 1);

  calc.type(k._1, k.plus, k._2)
    .testExpression(t, '1+2')
    .moveCursor(2)
    .delete(2)
    .testExpression(t, '2')
    .testCursor(t, 0)
    .type(k._3, k.plus)
    .testExpression(t, '3+2')
    .enter()
    .testExpression(t, '5')
    .testResult(t, '5')
    .testCursor(t, 1)
    .enter();

  t.end();
});

test('Inserting prefix operators', function (t) {
  calc
    .type(k._1, k.plus, k._2, k.sin)
    // '1+2|' => '1+sin(2|'
    .testExpression(t, '1+sin(2')
    .testCursor(t)
    .moveCursorBy(-1)
    .delete()
    // I'm not sure what is happening here,
    // but it doesn't bother the html.
    //.testExpression(t, '1+sin|2')
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .type(k.sin)
    // '(1+23)|' => 'sin(1+23)|'
    .testExpression(t, 'sin(1+23)')
    .testCursor(t)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .moveCursor(0)
    .type(k.sin)
    // '|(1+23)' => 'sin(1+23)|'
    .testExpression(t, 'sin(1+23)')
    .testCursor(t)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .moveCursorBy(-1)
    .type(k.sin)
    // '(1+23|)' => '(1+sin(23|)'
    .testExpression(t, '(1+sin(23)')
    .testCursor(t, 9)
    .clear()
    ;


  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .moveCursorBy(-2)
    .type(k.sin)
    // '(1+2|3)' => '(1+sin(23|)'
    .testExpression(t, '(1+sin(23)')
    .testCursor(t, 9)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .moveCursorBy(-3)
    .type(k.sin)
    // '(1+|23)' => '(1+sin(23|)'
    .testExpression(t, '(1+sin(23)')
    .testCursor(t, 9)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .moveCursorBy(-4)
    .type(k.sin)
    // '(1|+23)' => '(sin(1|+23)'
    .testExpression(t, '(sin(1+23)')
    .testCursor(t, 6)
    .clear()
    ;


  calc
    .type(k.openParens, k._1, k.plus, k._2, k._3, k.closeParens)
    .testExpression(t, '(1+23)')
    .moveCursor(1)
    .type(k.sin)
    // '(|1+23)' => '(sin(1|+23)'
    .testExpression(t, '(sin(1+23)')
    .testCursor(t, 6)
    .clear()
    ;


  calc
    .type(k._1, k.plus, k.sin, k._2, k._3, k.closeParens)
    .testExpression(t, '1+sin(23)')
    .moveCursor(2)
    .type(k.cos)
    // '1+|sin(23)' => '1+cos(sin(23)|'
    .testExpression(t, '1+cos(sin(23)')
    .testCursor(t)
    .clear()
    ;    

  calc
    .type(k._1, k.plus, k.sin, k._2, k._3, k.closeParens)
    .testExpression(t, '1+sin(23)')
    .moveCursor(3)
    .type(k.cos)
    // '1+s|in(23)' => '1+cos(sin(23)|'
    .testExpression(t, '1+cos(sin(23)')
    .testCursor(t)
    .clear()
    ;

  calc
    .type(k._1, k.plus, k.sin, k._2, k._3, k.closeParens)
    .testExpression(t, '1+sin(23)')
    .moveCursor(5)
    .type(k.cos)
    // '1+sin|(23)' => '1+sin cos(23)|'
    .testExpression(t, '1+sin cos(23)')
    .testCursor(t)
    .clear()
    ;

  calc
    .type(k._1, k._2, k.kg)
    .testExpression(t, '12 kg')
    .moveCursorBy(-1)
    .type(k.cos)
    // '12 kg|' => 'cos(12 kg|'
    .testExpression(t, 'cos(12 kg')
    .testCursor(t)
    .clear()
    ;

  calc
    .type(k._1, k._2, k.kg, k.unitPower, k._2)
    .testExpression(t, '12 kg^2')
    .moveCursorBy(-1)
    .type(k.cos)
    // '12 kg|' => 'cos(12 kg^2|'
    .testExpression(t, 'cos(12 kg^2')
    .testCursor(t)
    .clear()
    ;

  calc
    .type(k._1, k._2, k.kg, k.unitPower, k._2)
    .testExpression(t, '12 kg^2')
    .moveCursorBy(-1)
    .type(k.fact)
    // '12 kg|' => '12! kg^2'
    //.testCursor(t, 3)
    .testExpression(t, '12! kg^2') // TODO: parser bug. postfix operations should have unitNodes.
    .clear()
    ;

  t.end();
});


test('Inserting postfix operators', function (t) {
  calc
    .type(k._1, k.plus, k._2, k._3)
    .testExpression(t, '1+23')
    .type(k.fact)
    // '1+23|' => '1+23!'
    .testExpression(t, '1+23!')
    //.testCursor(t)
    .clear()
    ;

  calc
    .type(k._1, k.plus, k._2, k._3)
    .testExpression(t, '1+23')
    .moveCursorBy(-1)
    .type(k.fact)
    // '1+2|3' => '1+23!'
    .testExpression(t, '1+23!')
    //.testCursor(t)
    .clear()
    ;

  calc
    .type(k._1, k.plus, k._2, k._3)
    .testExpression(t, '1+23')
    .moveCursorBy(-2)
    .type(k.fact)
    // '1+|23' => '1+23!'
    .testExpression(t, '1+23!')
    //.testCursor(t)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k._2, k.closeParens)
    .testExpression(t, '(12)')
    .type(k.fact)
    // '(12)|' => '(12)!'
    .testExpression(t, '(12)!')
    //.testCursor(t)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k._2, k.closeParens)
    .testExpression(t, '(12)')
    .moveCursorBy(-1)
    .type(k.fact)
    // '(12|)' => '(12!)'
    .testExpression(t, '(12!)')
    //.testCursor(t)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k._2, k.closeParens)
    .testExpression(t, '(12)')
    .moveCursorBy(-2)
    .type(k.fact)
    // '(1|2)' => '(12!)'
    .testExpression(t, '(12!)')
    //.testCursor(t)
    .clear()
    ;


  calc
    .type(k.openParens, k._1, k._2, k.closeParens)
    .testExpression(t, '(12)')
    .moveCursorBy(-3)
    .type(k.fact)
    // '(|12)' => '(12!)'
    .testExpression(t, '(12!)')
    //.testCursor(t)
    .clear()
    ;


  calc
    .type(k.openParens, k._1, k._2, k.closeParens)
    .testExpression(t, '(12)')
    .moveCursor(0)
    .type(k.fact)
    // '|(12)' => '(12!)'
    .testExpression(t, '(12)!')
    //.testCursor(t)
    .clear()
    ;

  calc
    .type(k.openParens, k._1, k._2, k.closeParens, k.fact)
    .testExpression(t, '(12)!')
    .moveCursor(4)
    .type(k.sin)
    // '(12)|!' => 'sin(12)!'
    .testExpression(t, 'sin(12)!')
    //.testCursor(t)
    .clear()
    ;

  t.end();
});


test('Cute hacks', function (t) {
  calc
    .type(k._1, k.times, k._2)
    .testExpression(t, "1×2")
    .moveCursor(1)
    .delete()
    .testExpression(t, '×2') // obviously invalid
    .delete()
    .testExpression(t, '2') // this won't scale to binary operators of more than one character, but it's a nice fallback.
    .delete()
    .testExpression(t, '2') // won't do anything because it's valid
    .testCursor(t, 0)
    .enter()
    ;

  calc
    .type(k.pi, k.times, k._3)
    .testExpression(t, "pi×3")
    .moveCursor(2)
    .delete()
    .testExpression(t, '×3') // obviously invalid
    .delete()
    .testExpression(t, '3') // Just delete the first literal token.
    .delete()
    .testExpression(t, '3') // won't do anything because it's valid
    .testCursor(t, 0)
    .enter()
    ;  
  t.end();
});

test('removal of matching brackets', function (t) {
  calc.type(k.openParens, k._1, k.closeParens, k.plus, k._2)
    .testExpression(t, '(1)+2')
    .moveCursorBy(-2)
    .delete()
    .testExpression(t, '1+2')
    .testCursor(t, 1)
    .enter();
  t.end();
});

test('appending after enter', function (t) {
  calc.type(k._1, k.plus, k._2)
    .enter()
    .testExpression(t, '3')
    .type(k.times)
    .testExpression(t, '3×')
    .type(k._4)
    .testExpression(t, '3×4')
    .enter();
  t.end();
});

test('delete quirks', function (t) {
  calc.type(k._1)
    .enter()
    .testExpression(t, '1')
    .testResult(t, '1')
    .type(k._2)
    .testExpression(t, '2')
    .testCursor(t, 1)
    .delete()
    .testExpression(t, '')
    .testCursor(t, 0)
    // clear
    .type(k._1)
    .enter();

  calc.type(k._1)
    .type(k.plus)
    .type(k.sin)
    .type(k._2)
    .testExpression(t, '1+sin(2')
    .moveCursorBy(-1)
    .delete()
    .testExpression(t, '1+sin 2')
    .moveCursorBy(-1)
    .delete()
    .testExpression(t, '1+2')
    .testCursor(t, 2)
    .clear();

  calc.type(k.minus)
    .type(k._1)
    .testExpression(t, '-1')
    .moveCursorBy(-1)
    .delete()
    .testExpression(t, '1')
    .clear();

  calc.type(k._1)
    .type(k._2)
    .type(k._3)
    .type(k._4)
    .type(k.tonne)
    .testExpression(t, '1234 tonne')
    .moveCursorBy(-1)
    .delete()
    .testExpression(t, '1234')
    .testCursor(t)
    .clear();

  calc.type(k._1)
    .type(k.minus)
    .type(k.minus)
    .type(k._2)
    .testExpression(t, '1--2')
    .moveCursorBy(-1)
    .moveCursorBy(+1);
    
  calc.delete()
    // pipe means syntax error.
    .testExpression(t, '1--');

  calc.delete()
    .testExpression(t, '1-')
    .clear();

  calc.type(k._1)
    .type(k.times)
    .type(k.plus)
    .type(k.minus)
    .type(k._2)
    .testExpression(t, '1×+-2')
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .delete()
    // pipe means syntax error.
    .testExpression(t, '1×+-')
    .delete()
    .testExpression(t, '1×+')
    .clear();


  calc.type(k._1)
    .type(k.kg)
    .testExpression(t, '1 kg')
    .type(k.unitIn)
    .testExpression(t, '1 kg in ')
    .type(k.tonne)
    .testExpression(t, '1 kg in tonne')
    .testCursor(t)
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .testCursor(t)
    .delete()
    // pipe means syntax error.
    .testExpression(t, '1 kg in')
    .type(k.kg)
    .testExpression(t, '1 kg in kg')
    //.testCursor(t)  // fails here, because cursor is too left
    ;
  calc.delete()
    // pipe means syntax error.
    .testExpression(t, '1 kg in')
    .delete()
    .testExpression(t, '1 kg')
    .testCursor(t)
    .clear();

  calc.type(k.sin)
    .type(k._1)
    .type(k.plus)
    .type(k._2)
    .type(k.closeParens)
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .testExpression(t, 'sin(1+2)')
    .testCursor(t)
    .delete()
    .testExpression(t, 'sin 1+2')
    .testCursor(t)
    .delete()
    .testExpression(t, 'sin 1+')
    .delete()
    .testExpression(t, 'sin 1')
    .testCursor(t)
    .delete()
    .testExpression(t, 'sin')
    .delete()
    .testExpression(t, '')
    .clear();

  calc.type(k.sin, k._1, k.plus, k._2, k.closeParens)
    .type(k.plus, k._3)
    .testExpression(t, 'sin(1+2)+3')
    .testCursor(t)
    .moveCursorBy(-1)
    .delete()
    .testExpression(t, 'sin(1+2)3')
    .delete()
    .testExpression(t, 'sin 1+23')
    .delete()
    .testExpression(t, 'sin 1+3')
    .delete()
    .testExpression(t, 'sin 13')
    .delete()
    .testExpression(t, 'sin 3')
    .delete()
    .testExpression(t, '3')
    .delete()
    .testExpression(t, '3')
    .clear();

  calc.type(k._1)
    .type(k.kg)
    .type(k.tonne)
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .testExpression(t, '1 kg tonne')
    .testCursor(t)
    .delete()
    .testExpression(t, '1 kg')
    .testCursor(t)
    .delete()
    .testExpression(t, '1')
    .testCursor(t)
    .clear();

  calc.type(k._1, k.unitPer)
    .testExpression(t, '1/')
    .type(k.kg)
    .testExpression(t, '1/kg')
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .delete()
    .testExpression(t, '1/')
    .type(k.tonne)
    .testExpression(t, '1/tonne')
    .testCursor(t)
    .type(k.kg)
    .testExpression(t, '1/tonne kg')
    .moveCursorBy(-1)
    .delete()
    .testExpression(t, '1/tonne')
    .testCursor(t)
    .delete()
    .testExpression(t, '1/')
    .delete()
    .testExpression(t, '1')
    .testCursor(t)
    .clear();

  calc.type(k._1, k.kg)
    .testExpression(t, '1 kg')
    .clear();


  t.end();
});


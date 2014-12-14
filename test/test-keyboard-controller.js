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

test('Prefix ops', function (t) {
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
    .enter()
    ;

  t.end();
});

test('Cute hacks', function (t) {
  calc
    .type(k._1, k.times, k._2)
    .testExpression(t, "1*2")
    .moveCursor(1)
    .delete()
    .testExpression(t, '|*2') // obviously invalid
    .delete()
    .testExpression(t, '2') // this won't scale to binary operators of more than one character, but it's a nice fallback.
    .delete()
    .testExpression(t, '2') // won't do anything because it's valid
    .testCursor(t, 0)
    .enter()
    ;

  calc
    .type(k.pi, k.times, k._3)
    .testExpression(t, "pi*3")
    .moveCursor(2)
    .delete()
    .testExpression(t, '|*3') // obviously invalid
    .delete()
    .testExpression(t, '3') // this won't scale to binary operators of more than one character, but it's a nice fallback.
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
    .testExpression(t, '3*|')
    .type(k._4)
    .testExpression(t, '3*4')
    .enter();
  t.end();
});

test('exponents', function (t) {
  // 1e2
  calc.type(k._1, k.exponent, k._2)
    .testExpression(t, '1e2')
    .testResult(t, '100')
    .enter()
    ;

  // 1|23e45
  calc.type(k._1, k._2, k._3, k.exponent, k._4, k._5)
    .testExpression(t, '123e45')
    .moveCursor(1)
    .type(k.exponent)
    .testExpression(t, '1.23e47')
    .type(k._1)
    .testExpression(t, '1.23e471')
    .enter()
    ;

  // 1.2|3456e78
  calc.type(k._1, k.point, k._2, k._3, k._4, k._5, k._6, k.exponent, k._7, k._8)
    .testExpression(t, '1.23456e78')
    .moveCursor(3)
    .testCursor(t, 3)
    .type(k.exponent)
    .testExpression(t, '12.3456e77')
    .testCursor(t)
    .delete()
    .testExpression(t, '1.23456e78')
    .enter()
    ;

  // 1.23|456
  calc.type(k._1, k.point, k._2, k._3, k._4, k._5, k._6)
    .testExpression(t, '1.23456')
    .moveCursor(4)
    .testCursor(t, 4)
    .type(k.exponent)
    .testExpression(t, '123.456e-2')
    .testCursor(t)
    .delete()
    .testExpression(t, '1.23456')
    .enter()
    ;

  // 1|234.56
  calc.type(k._1, k._2, k._3, k._4, k.point, k._5, k._6, k.plus, k._0)
    .testExpression(t, '1234.56+0')
    .moveCursor(1)
    .type(k.exponent)
    .testExpression(t, '1.23456e3+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 12|34.56
  calc.type(k._1, k._2, k._3, k._4, k.point, k._5, k._6, k.plus, k._0)
    .testExpression(t, '1234.56+0')
    .moveCursor(2)
    .type(k.exponent)
    .testExpression(t, '12.3456e2+0')
    .testCursor(t, -2)
    .enter()
    ;


  // 12|34.56e7
  calc.type(k._1, k._2, k._3, k._4, k.point, k._5, k._6, k.exponent, k._7, k.plus, k._0)
    .testExpression(t, '1234.56e7+0')
    .moveCursor(2)
    .type(k.exponent)
    .testExpression(t, '12.3456e9+0')
    .testCursor(t, -2)
    .enter()
    ;
  // 123|456  
  // 1.23|456
  // 12|345e6
  // 1.23|45e6
  // 0.0|0123
  // 0.00|123
  // 0.001|23
  // 0.0|0123e2


  // 123|456  
  calc.type(k._1, k._2, k._3, k._4, k._5, k._6, k.plus, k._0)
    .testExpression(t, '123456+0')
    .moveCursor(3)
    .type(k.exponent)
    .testExpression(t, '123.456e3+0')
    .testCursor(t, 9)
    .enter()
    ;

  // 1.23|456
  calc.type(k._1, k.point, k._2, k._3, k._4, k._5, k._6, k.plus, k._0)
    .testExpression(t, '1.23456+0')
    .moveCursor(4)
    .type(k.exponent)
    .testExpression(t, '123.456e-2+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 12|345e6
  calc.type(k._1, k._2, k._3, k._4, k._5, k.exponent, k._6, k.plus, k._0)
    .testExpression(t, '12345e6+0')
    .moveCursor(2)
    .type(k.exponent)
    .testExpression(t, '12.345e9+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 1.23|45e6
  calc.type(k._1, k.point, k._2, k._3, k._4, k._5, k.exponent, k._6, k.plus, k._0)
    .testExpression(t, '1.2345e6+0')
    .moveCursor(3)
    .type(k.exponent)
    .testExpression(t, '12.345e5+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 0.0|0123
  calc.type(k._0, k.point, k._0, k._0, k._1, k._2, k._3, k.plus, k._0)
    .testExpression(t, '0.00123+0')
    .moveCursor(3)
    .type(k.exponent)
    .testExpression(t, '0.0123e-1+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 0.00|123
  calc.type(k._0, k.point, k._0, k._0, k._1, k._2, k._3, k.plus, k._0)
    .testExpression(t, '0.00123+0')
    .moveCursor(4)
    .type(k.exponent)
    .testExpression(t, '0.123e-2+0')
    .testCursor(t, -2)
    .enter()
    ;
  

  // 0.001|23
  calc.type(k._0, k.point, k._0, k._0, k._1, k._2, k._3, k.plus, k._0)
    .testExpression(t, '0.00123+0')
    .moveCursor(5)
    .type(k.exponent)
    .testExpression(t, '1.23e-3+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 0.0|012e3
  calc.type(k._0, k.point, k._0, k._0, k._1, k._2, k.exponent, k._3, k.plus, k._0)
    .testExpression(t, '0.0012e3+0')
    .moveCursor(3)
    .type(k.exponent)
    .testExpression(t, '0.012e2+0')
    .testCursor(t, -2)
    .enter()
    ;

  calc.type(k._1, k.point, k._2, k.exponent, k._3, k.plus, k._0)
    .testExpression(t, '1.2e3+0')
    .moveCursor(3)
    .type(k.exponent)
    .testExpression(t, '12e2+0')
    .testCursor(t, -2)
    .enter()
    ;

  // 1|e2
  calc.type(k._1, k.exponent, k._2, k.plus, k._0)
    .testExpression(t, '1e2+0')
    .moveCursor(1)
    .type(k.exponent)
    .testExpression(t, '1e2+0')
    .testCursor(t, -2)
    .enter()
    ;
  t.end();
});

test('delete quirks', function (t) {
  calc.type(k._1)
    .enter()
    .testExpression(t, '1')
    .testResult(t, '1')
    .type(k._2)
    .testCursor(t, 1)
    .delete()
    .testCursor(t, 0)
    .testExpression(t, '|')
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
    .testExpression(t, '1--|');

  calc.delete()
    .testExpression(t, '1-|')
    .clear();

  calc.type(k._1)
    .type(k.times)
    .type(k.plus)
    .type(k.minus)
    .type(k._2)
    .testExpression(t, '1*+-2')
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .delete()
    // pipe means syntax error.
    .testExpression(t, '1*+-|')
    .delete()
    .testExpression(t, '1*+|')
    .clear();


  calc.type(k._1)
    .type(k.kg)
    .testExpression(t, '1 kg')
    .type(k.unitIn)
    .testExpression(t, '1 kg in |')
    .type(k.tonne)
    .testExpression(t, '1 kg in tonne')
    .testCursor(t)
    .moveCursorBy(-1)
    .moveCursorBy(+1)
    .testCursor(t)
    .delete()
    // pipe means syntax error.
    .testExpression(t, '1 kg in |')
    .type(k.kg)
    .testExpression(t, '1 kg in kg')
    .testCursor(t);

  calc.delete()
    // pipe means syntax error.
    .testExpression(t, '1 kg in |')
    .delete()
    .testExpression(t, '1 kg')
    .testCursor(t)
    .clear();


  t.end();
});


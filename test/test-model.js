var test = require("tap").test,
    _ = require("underscore"),

    Emitter = require("events").EventEmitter,
    Model = require("../lib/app/model.js");

var turo = {
  evaluate: function (string, parseRule, id) {
    return {
      id: id,
      src: string,
      value: 0,
      consequents: function () {
        return [this];
      },
      identifier: function () {
        return "x" + id;
      },
      identifierToString: function () {
        return this.identifier();
      },
      dispose: function () {
        return this;
      }
    };
  },
  renameVariable: function (old, newName) {
    console.log("Dummy rename from " + old + " to " + newName);
  }
};

test("Evaluate", function (t) {
  var array = [],
      model = new Model(turo, array);
  t.ok(model);
  t.ok(array);

  var s = model.evaluateString("1 + 1");
  t.equal(s.src, "1 + 1");
  t.equal(s.index, undefined);
  t.equal(array.length, 0);
  t.end();
});

test("Put", function (t) {

  var array = [],
      model = new Model(turo, array),
      s;
  t.ok(model);
  t.ok(array);

  s = model.putStatement("1 + 1");
  t.equal(s.src, "1 + 1");
  t.equal(s.index, 0);
  t.equal(array[0], s);

  s = model.putStatement("1 + 1", "x");
  t.equal(s.src, "x = 1 + 1");
  t.equal(s.index, 1);
  t.equal(array[1], s);

  s = model.putStatement("1 + 2", "x", 1);
  t.equal(s.src, "x = 1 + 2");
  // correction
  t.equal(s.index, 1);
  t.equal(array[1], s);

  s = model.putStatement("1 + 2", "x", 5);
  t.equal(s.src, "x = 1 + 2");
  // addition, but a ridiculous index
  t.equal(s.index, 2);
  t.equal(array[2], s);

  t.end();
});

test("Put NoArgs", function (t) {

  var array = [],
      model = new Model(turo, array),
      s;

  s = model.putStatement();

  t.equal(s.index, 0);
  t.equal(s.id, 0);

  s = model.putStatement();

  t.equal(s.index, 1);
  t.equal(s.id, 1);

  t.end();
});

test("Get", function (t) {
  var array = [],
      model = new Model(turo, array),

      x = model.putStatement("1 + 1", "x", 0),
      y = model.putStatement("1 + 2", "y", 1),
      z = model.putStatement("1 + 2", "z", 2);

  t.deepEqual(array, [x, y, z]);
  t.deepEqual(_.pluck(array, "index"), [0, 1, 2]);

  // ids start off as the indexes they are given.
  t.equal(model.getStatementWithId(0), x);
  t.equal(model.getStatementWithId(1), y);
  t.equal(model.getStatementWithId(2), z);

  t.end();
});

test("Remove", function (t) {
  var array = [],
      model = new Model(turo, array),

      x = model.putStatement("1 + 1", "x", 0),
      y = model.putStatement("1 + 2", "y", 1),
      z = model.putStatement("1 + 2", "z", 2);

  t.equal(x.index, 0);
  t.equal(y.index, 1);
  t.equal(z.index, 2);

  t.deepEqual(array, [x, y, z]);
  t.deepEqual(_.pluck(array, "index"), [0, 1, 2]);

  // ids start off as the indexes they are given.
  t.equal(model.getStatementWithId(0), x);
  t.equal(model.getStatementWithId(1), y);
  t.equal(model.getStatementWithId(2), z);

  model.removeStatement(y.index); // 1

  t.deepEqual(array, [x, z]);
  t.deepEqual(_.pluck(array, "index"), [0, 1]);

  t.equal(x.index, 0);
  t.equal(y.index, undefined);
  t.equal(z.index, 1);

  // maintain stable ids.
  t.equal(model.getStatementWithId(0), x);
  t.equal(model.getStatementWithId(1), undefined);
  t.equal(model.getStatementWithId(2), z);

  model.removeStatement(x.index); // 0

  t.deepEqual(array, [z]);
  t.deepEqual(_.pluck(array, "index"), [0]);


  t.equal(x.index, undefined);
  t.equal(y.index, undefined);
  t.equal(z.index, 0);

  t.equal(model.getStatementWithId(0), undefined);
  t.equal(model.getStatementWithId(1), undefined);
  t.equal(model.getStatementWithId(2), z);


  model.removeStatement(z.index); // 0

  t.deepEqual(array, []);
  t.deepEqual(_.pluck(array, "index"), []);

  t.end();
});


test("Swap", function (t) {
  var array = [],
      model = new Model(turo, array),

      x = model.putStatement("1 + 1", "x", 0),
      y = model.putStatement("1 + 2", "y", 1),
      z = model.putStatement("1 + 2", "z", 2);

  t.deepEqual(array, [x, y, z]);
  t.deepEqual(_.pluck(array, "index"), [0, 1, 2]);

  // ids start off as the indexes they are given.
  t.equal(model.getStatementWithId(0), x);
  t.equal(model.getStatementWithId(1), y);
  t.equal(model.getStatementWithId(2), z);

  // Now Swap a couple of things
  model.swapStatements(x.index, y.index);

  t.deepEqual(array, [y, x, z]);
  t.deepEqual(_.pluck(array, "index"), [0, 1, 2]);

  // But, we still maintatin lookup of stable ids to indexes.
  t.equal(model.getStatementWithId(0), x);
  t.equal(model.getStatementWithId(1), y);
  t.equal(model.getStatementWithId(2), z);

  model.swapStatements(z.index, y.index);
  t.deepEqual(array, [z, x, y]);
  t.deepEqual(_.pluck(array, "index"), [0, 1, 2]);

  model.swapStatements(x.index, y.index);
  t.deepEqual(array, [z, y, x]);
  t.deepEqual(_.pluck(array, "index"), [0, 1, 2]);

  t.end();
});


test("EvalErrors", function (t) {
  var Turo = new require("turo").Turo,
      turo = new Turo(),
      array = [], s, r,
      model = new Model(turo, array);

  s = model.putStatement("1", "x", 0);
  t.ok(!s.identifierErrors());

  s = model.putStatement("2", "z", 1);
  t.ok(!s.identifierErrors());

  // we can try out renaming x to y, and no errors
  r = model.evaluateString("1 + 1", "y", 0);
  t.ok(!r.identifierErrors());
  // we can try renaming back, and no errors
  r = model.evaluateString("2 + 1", "x", 0); //
  t.ok(!r.identifierErrors());

  // we can try out renaming z to z, and no errors
  r = model.evaluateString("1 + 2", "y", 1);
  t.ok(!r.identifierErrors());
  // we can try renaming back, and no errors
  r = model.evaluateString("2 + 2", "z", 1); //
  t.ok(!r.identifierErrors());

  // put an empty statement in.
  s = model.putStatement();
  t.ok(!s.identifierErrors());

  // use a name we've already used before. We get errors
  r = model.evaluateString("1 + 3", "x", 1);
  t.ok(r.identifierErrors());

  // use a name we've not used before, the errors go away.
  r = model.evaluateString("1 + 3", "y", 1);
  t.ok(!r.identifierErrors());

  // now expression errors
  r = model.evaluateString("1 + 3", "y", 1);
  t.ok(!r.expressionErrors());

  // induce a semantic error.
  r = model.evaluateString("1 / 0", undefined, 1);
  t.ok(r.expressionErrors());

  // induce a syntax error.
  r = model.evaluateString("1 / ", undefined, 1);
  t.ok(r.expressionErrors());

  t.end();
});

test("Renaming", function (t) {
  var Turo = new require("turo").Turo,
      turo = new Turo(),
      array = [], s, r,
      x, y, z, expression,
      model = new Model(turo, array);

  x = model.putStatement("1", "x", 0);
  y = model.putStatement("1 + x", "y", 1);
  z = model.putStatement("x + y", "z", 2);
  expression = model.putStatement("x + y + z", undefined, 3);

  model.renameVariable("x", "a");

  t.equal(array[1].expressionToString(), "1+a");
  t.equal(array[2].expressionToString(), "a+y");
  t.equal(array[3].expressionToString(), "a+y+z");


  // now, instead of doing it through renameVariable, let's do it through putStatement
  model.putStatement("a + 1", "b", 1);
  t.equal(array[1].expressionToString(), "a+1");
  t.equal(array[2].expressionToString(), "a+b");

  t.end();
});

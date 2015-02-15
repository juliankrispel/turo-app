'use strict';

var _ = require('underscore'),
    test = require('tap').test;

var DocumentModel = require('../lib/app/document-model');

function testDocument(t, model, lines, expected) {
  var results = model.parseDocument(lines.join('\n'));

  t.equal(expected.length, results.length, 'Number of result: ' + expected.length + ' == ' + results.length);

  var i = 0;
  _.each(results, function (observed) {
    t.equal(expected[i], observed.number, observed.number + ' == ' + expected[i]);
    i++;
  });
}

test('Basic construction', function (t) {

  var model = DocumentModel.newModel();

  testDocument(t, model,
    [
      '1 + 2',
      'free text',
      'variable = 4'
    ], [
      3,
      4
    ]);

  testDocument(t, model,
    [
      'x = 7',
      'y = x + 2'
    ], [
      7,
      9
    ]);

  t.end();
});

test('Out of order execution', function (t) {
  // this should change everything.
  var model = DocumentModel.newModel();
  testDocument(t, model,
    [
      'y = x + 2',
      'x = 7',
    ], [
      9,
      7
    ]);

  t.end();
});

test('Individual lines', function (t) {
  var model = DocumentModel.newModel();
  testDocument(t, model,
    [
      'x = 7',
      'y = x + 2'
    ], [
      7,
      9
    ]);

  model.moveCursor(8); // should be in the middle of the second line
  model.parseSingleStatement('y = x + 3');

  console.log(model.results);
  var observed = _.pluck(model.results, 'number');
  observed = _.pluck(observed, 'number')
  console.log(observed);
  t.deepEqual(observed, [7, 10]);

  t.end();
});

test('', function (t) {

  t.end();
});
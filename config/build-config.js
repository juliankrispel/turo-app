module.exports = {
  'dist-relative': {
    'android': './app/src/main/assets/generated-javascript'
  },

  'idl-dist': {
    'android': './app/src/main/java',
  },

  'run-command': {
    '': 'echo "localhost already running"'
  },

  // to be copied into the top level dist directory.
  'resources-common': [
    'index.android.html'
  ],

  'resources-specific': [],

  // grunt tasks we call depending on build variant.
  'extra-build-tasks': [],

  'browserify-aliases': {
    '': [],
    'web': [],
    'webview': require('macro-aliasify')(__dirname + '/..')
  } 
};
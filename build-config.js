module.exports = {
  'dist-relative': {
    'android': './app/src/main/assets/www'
  },

  'idl-dist': {
    'android': './app/src/main/java',
  },

  'run-command': {
    '': 'echo "localhost already running"'
  },

  // to be copied into the top level dist directory.
  'resources-common': [
  ],

  'resources-specific': [],

  // grunt tasks we call depending on build variant.
  'extra-build-tasks': [],

};
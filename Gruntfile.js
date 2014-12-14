'use strict';

module.exports = function(grunt){
  var conf = require('build-facets')(__dirname)
            .loadConfiguration('./config/build-config.js')
            .loadConfiguration('./config/build-config-local.js');

  grunt.initConfig({
    dist: {
      build: 'build',
      assemble: 'build/assemble',
      dir: conf.resolve('project-dir', 'dist-relative'),
      idl: conf.resolve('project-dir', 'idl-dist'),
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['*.js', 'lib/**/*.js', 'test/**/*.js', '!test/mocha/*.js', 'idl/**/*.js', 'config/**/*.js', '!*.min.js', '!lib/generated/**/*.js', '!*.stub.js']
    },

    node_tap: {
      short_tests: {
        options: {
          outputType: 'failures', // tap, failures, stats
          outputTo: 'console' // or file
          //outputFilePath: '/tmp/out.log' // path for output file, only makes sense with outputTo 'file'
        },
        files: {
          'tests': ['./test/test-*.js']
        }
      }
    },

    browserify: {
      dist: {
        files: {
          // should use '<%=dist.assemble%>'
          // the rest of the modules will be lazily discovered.
          'build/assemble/app.min.js': ['lib/app/turo-application.js']
        },
      },
      options: {
        require: ['kirin'],
        alias: conf.get('browserify-aliases'),
        debug: true
      }
    },

    clean: {
      options: {
        force: true, // we need this to be able to clean the dist directory outside of this dir.
      },
      main: {
        force: true,
        src: [ '<%=dist.dir%>', '<%=dist.assemble%>', '<%=dist.build%>' ]
      }
    },

    copy: {
      main: {
        files: [
          { expand: true, dot: true, cwd: 'build/assemble', src: [ '**' ], dest: '<%=dist.dir%>' },
          { flatten: true, expand: true, cwd: '.', src: 'node_modules/kirin/views/index.html', dest: '<%=dist.dir%>' },
          { flatten: false, expand: true, cwd: 'resources', src: conf.get('resources-common'), dest: '<%=dist.dir%>' },
          { flatten: false, expand: true, cwd: 'resources', src: conf.get('resources-specific'), dest: '<%=dist.dir%>' }
        ]
      }
    },

    watch: {
      javascript: {
        files: [
          '<%= jshint.all %>',
          'resources/*'
        ],
        tasks: ['build']
      }
    },

    shell: {
      runNative: {
        command: conf.get('run-command'),
        options: {
          execOptions: {
            cwd: conf.resolve('project-dir')
          }
        }
      },
    },
    
    idl: {
      javascript: {
        lang: 'javascript', 
        src: ['idl/*.js'],
        dest: './lib/generated'
      },
      native: {
        lang: conf.buildVariant.platform,
        src: ['idl/*.js'],
        dest: '<%= dist.idl %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-node-tap');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('kirin-idl');

  grunt.registerTask('_build-extras', conf.get('extra-build-tasks'));  

  grunt.registerTask('build-dirty',[
    'clean:main', 'idl:javascript', 'browserify', 'copy:main', 'idl:native', '_build-extras'
  ]);

  grunt.registerTask('_build-common',[
    'jshint', 'node_tap', 'build-dirty'
  ]);

  grunt.registerTask('default',[
    '_build-common', 'watch'
  ]);

  grunt.registerTask('run-native',[
    'shell:runNative'
  ]);

  grunt.registerTask('build',[
    '_build-common'
  ]);

  grunt.registerTask('test',[
    'jshint', 'node_tap'
  ]);
};

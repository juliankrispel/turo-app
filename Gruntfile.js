module.exports = function(grunt){
  grunt.initConfig({
    dist: {
      build: 'build',
      cordova: {
        dir: 'cordova',
        www: 'cordova/www'
      },
      icons: {
        android: 'cordova/platforms/android/res/drawable'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['lib/**/*.js', 'test/*.js', '!*.min.js', 'Gruntfile.js', 'idl/*.idl.js']
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
          // should use '<%=dist.build%>'
          // the rest of the modules will be lazily discovered.
          'build/turo.min.js': ['lib/x-tag-components/*.js']
        }
      },
      options: {
        debug: true
      }
    },

    clean: {
      options: {
        force: true, // we need this to be able to clean the dist directory outside of this dir.
      },
      main: {
        force: true,
        src: [ '<%=dist.build%>' ]
      },
      cordova: {
        force: true,
        src: [ '<%=dist.cordova.www%>' ]
      }
    },

    copy: {
      main: {
        files: [
          { flatten: false, expand: true, cwd: 'resources', src: ['**'], dest: '<%=dist.build%>' },
          { flatten: true, expand: true, src: ['views/*'], dest: '<%=dist.build%>', filter: 'isFile' },
          { flatten: true, expand: true, src: ['node_modules/x-tag-core/dist/x-tag-core.js'], dest: '<%=dist.build%>' }
        ]
      },
      cordova: {
        files: [
          { expand: true, dot: true, cwd: '<%=dist.build%>', src: [ '**' ], dest: '<%=dist.cordova.www%>' },
          { expand: true, dot: true, src: [ 'resources/config.xml' ], dest: '<%=dist.cordova.www%>' },
          // TODO copy splash screen assets to platform specific dirs. The production of these images can't be automated.
          /*
            cordova/platforms/ios/:
              ./Turo/Resources/splash/Default-568h@2x~iphone.png
              ./Turo/Resources/splash/Default-Landscape@2x~ipad.png
              ./Turo/Resources/splash/Default-Landscape~ipad.png
              ./Turo/Resources/splash/Default-Portrait@2x~ipad.png
              ./Turo/Resources/splash/Default-Portrait~ipad.png
              ./Turo/Resources/splash/Default@2x~iphone.png
              ./Turo/Resources/splash/Default~iphone.png
          */
          /*
            cordova/platforms/android/
              ./res/drawable/splash.9.png
          */
          { expand: true, flatten: true, filter: 'isFile', cwd: 'resources/img',
                  src: 'icon.png',
                  dest: '<%=dist.icons.android%>' },
        ]
      }
    },

    watch: {
      browser: {
        files: [
          '<%= jshint.all %>',
          'lib/**/*.html',
          'views/*', 'style/*',
          'node_modules/turo/lib/*', 'Gruntfile.js', 'resources/*'
        ],
        tasks: ['build-browser']
      },
      cordova: {
        files: ['<%= watch.browser.files %>'],
        tasks: ['build-cordova']
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  grunt.loadNpmTasks('grunt-node-tap');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  

  grunt.registerTask('_build-common',[
    'jshint', 'node_tap', 'clean:main', 'browserify', 'copy:main'
  ]);

  grunt.registerTask('default',[
    'build-browser', 'watch:browser'
  ]);

  grunt.registerTask('build-browser',[
    '_build-common'
  ]);

  grunt.registerTask('build-cordova', [
    '_build-common', 'clean:cordova', 'copy:cordova'
  ]);

  grunt.registerTask('cordova',[
    'build-cordova', 'watch:cordova'
  ]);

  grunt.registerTask('server', [
    'connect:server:keepalive'
  ]);

  grunt.registerTask('test',[
    'jshint', 'node_tap'
  ]);
};

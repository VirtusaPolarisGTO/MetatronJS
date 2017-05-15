module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    var bannerContent = '/*\n' +
        ' *  <%= pkg.name %>\n' +
        ' *  <%= pkg.description %>\n' +
        ' *  Version: <%= pkg.version %>\n' +
        ' *  Author: <%= pkg.author %>\n' +
        ' *\n' +
        ' *    Copyright 2017 VirtusaPolaris.\n' +
        ' *\n' +
        ' *    Licensed under the Apache License, Version 2.0 (the "License");\n' +
        ' *    you may not use this file except in compliance with the License.\n' +
        ' *    You may obtain a copy of the License at\n' +
        ' *\n' +
        ' *       http://www.apache.org/licenses/LICENSE-2.0\n' +
        ' *\n' +
        ' *    Unless required by applicable law or agreed to in writing, software\n' +
        ' *    distributed under the License is distributed on an "AS IS" BASIS,\n' +
        ' *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n' +
        ' *    See the License for the specific language governing permissions and\n' +
        ' *    limitations under the License.\n' +
        ' */\n' +
        '\n';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            options: {
                configFile: 'eslint.json',
                reset: true
            },
            target: ['src/Main.js', 'src/EventAPI.js', 'src/EntityStore.js', 'src/CommandExecuter.js', 'src/Commands.js', 'src/DrawingBoard.js', 'src/Util.js']
        },
        concat: {
            options: {
                banner: bannerContent
            },
            target: {
                src: ['src/Main.js', 'src/EventAPI.js', 'src/EntityStore.js', 'src/CommandExecuter.js', 'src/Commands.js', 'src/DrawingBoard.js', 'src/Util.js', 'src/RaphaelUtil.js'],
                dest: 'distrib/metatron.js'
            }
        },
        uglify: {
            options: {
                banner: bannerContent
            },
            build: {
                src: 'distrib/metatron.js',
                dest: 'distrib/metatron.min.js'
            }
        }
    });

    grunt.registerTask('default', ['eslint', 'concat', 'uglify']);
};
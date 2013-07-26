module.exports = function(grunt){
    grunt.initConfig({
        concurrent: {
            target: {
                tasks: ['nodemon', 'watch', 'less']
            },
            options: {
                logConcurrentOutput: true
            }
        },

        nodemon: {
            prod:{
                options: {
                    ignoredFiles: ['client/*', 'node_modules/*', 'server/views/*']
                }
            }
        },

        less: {
            compile: {
                options: {
                    yuicompress: true
                },
                files: {
                    'client/styles/main.css': 'client/styles/main.less',
                    'client/styles/admin.css': 'client/styles/admin.less'
                }
            }
        },

        watch: {
            css: {
                files: ['client/styles/*.less'],
                tasks: ['less']
            }
        },
    });

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concurrent']);

};
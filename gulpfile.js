var conf = {
    base: {
        src: "src/main",
        dist: 'dist',
        test: "**/*.spec.js",
        watch: "src",
        serve: "src/main/html"
    },
    modules: {
        peer: {
            browserify: "src/main/js/peerTest.js"
        },
        main: {
            browserify: "src/main/js/main.js"
        },
        libs: {
            jsConcat: "src/lib"
        }
    }
};

require("rauricoste-gulp")(conf);

var config = {
    dist: "dist",
    modules: {
        example: {
            src: "src/main/example",
            browserify: {
                entry: "main.js",
                output: "bundle.js"
            },
            watch: true
        },
        lib: {
            src: "src/main/js",
            browserify: {
                entry: "expose.js",
                output: "lib.js"
            },
            watch: true
        }
    },
}
require("rauricoste-web-builder").watch(config);
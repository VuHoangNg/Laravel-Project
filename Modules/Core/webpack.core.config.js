const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        core: "./Modules/Core/Resources/assets/js/index.jsx",
    },
    output: {
        // Correct the output directory to an absolute path
        path: path.resolve("public/modules"),
        filename: "[name]/[name].js",
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/, //
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                },
            },
            {
                test: /\.scss$/, // Handles Sass/SCSS files
                use: ["style-loader", "css-loader", "sass-loader"], // Converts SCSS to CSS and injects it into the DOM
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx"], // Resolves .js and .jsx extensions
    },
};

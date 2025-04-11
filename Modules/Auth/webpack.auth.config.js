const path = require("path");

module.exports = {
    mode: "development", // Change to "production" for production builds
    entry: {
        auth: "./Modules/Auth/src/Resources/assets/js/app.jsx", // Entry point for Auth module
    },
    output: {
        path: path.resolve("public/modules/auth"),
        filename: "[name].js", // Output file name will be "auth.js"
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/, // Handles .js and .jsx files
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"], // Transpile modern JS and React
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
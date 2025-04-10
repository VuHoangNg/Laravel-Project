const path = require("path");

module.exports = {
    mode: "development", // Switch to "production" for production builds
    entry: {
        auth: "./Modules/Auth/src/Resources/assets/js/app.jsx", // Entry point specific to Auth module
    },
    output: {
        path: path.resolve(__dirname, "public/build"), // Output directory for the Auth module
        filename: "[name].js", // Output file name based on entry key
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/, // Handle .js and .jsx files
                exclude: /node_modules/, // Exclude dependencies from processing
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"], // Transpile modern JS and React
                    },
                },
            },
            {
                test: /\.scss$/, // Handle Sass files
                use: ["style-loader", "css-loader", "sass-loader"], // Process Sass into CSS
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx"], // Resolve file extensions for imports
    },
};
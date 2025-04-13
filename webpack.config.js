const path = require("path");

module.exports = {
    mode: "development", // Change to "production" for production builds
    entry: {
        blog: "./Modules/Blog/src/Resources/assets/js/app.jsx", // Blog entry
        core: "./Modules/Core/src/Resources/assets/js/app.jsx", // Core entry
    },
    output: {
        // Correct the output directory to an absolute path
        path: path.resolve(__dirname, "public/modules"),
        filename: "[name]/[name].js", // Dynamic output: auth.js -> Auth folder, blog.js -> Blog folder
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                },
            },
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx"], // Resolves .js and .jsx extensions
    },
};

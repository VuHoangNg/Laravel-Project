const path = require("path");

module.exports = {
    mode: "development", // Change to "production" for production builds
    entry: {
        auth: "./Modules/Auth/Resources/assets/js/app.jsx", // Auth entry
        blog: "./Modules/Blog/Resources/assets/js/app.jsx", // Blog entry
        core: "./Modules/Core/Resources/assets/js/index.jsx", // Core entry
        media: "./Modules/Media/Resources/assets/js/app.jsx", // Media entry
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

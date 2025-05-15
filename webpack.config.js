const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        auth: "./Modules/Auth/Resources/assets/js/app.js",
        blog: "./Modules/Blog/Resources/assets/js/app.js",
        core: "./Modules/Core/Resources/assets/js/index.js",
        media: "./Modules/Media/Resources/assets/js/index.js",
        user: "./Modules/User/Resources/assets/js/index.js",
        script: "./Modules/Script/Resources/assets/js/index.js",
    },
    output: {
        path: path.resolve(__dirname, "public/modules"),
        filename: "[name]/[name].js",
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

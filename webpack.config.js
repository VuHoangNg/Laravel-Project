const path = require("path");

module.exports = {
    mode: "development", // Change to 'production' for production builds
    entry: {
        auth: "./Modules/Auth/src/Resources/assets/js/app.jsx",
    },
    output: {
        path: path.resolve(__dirname, "Modules/Auth/public/build"),
        filename: "[name].js",
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
        extensions: [".js", ".jsx"],
    },
};

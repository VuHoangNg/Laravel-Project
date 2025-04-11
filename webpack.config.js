const path = require("path");

module.exports = {
    mode: "development", // Change to 'production' for production builds
    entry: {
        auth: "./Modules/Auth/src/Resources/assets/js/app.jsx",
        blog: "./Modules/Blog/src/Resources/assets/js/app.jsx", // Entry point for Blog module
    },
    output: {
        path: (pathData) => {
            const name = pathData.chunk.name;
            return path.resolve(__dirname, `public/modules/${name}/`);
        },
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

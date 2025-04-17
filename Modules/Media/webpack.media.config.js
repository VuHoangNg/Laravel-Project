const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    media: "./Modules/Media/Resources/assets/js/app.jsx",
  },
  output: {
    path: path.resolve(__dirname, "../../public/modules"),
    filename: "[name]/[name].js",
    publicPath: "/modules/",
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
  devServer: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
};
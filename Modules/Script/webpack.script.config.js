const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    media: "./Modules/Script/Resources/assets/js/index.jsx",
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
    extensions: [".js", ".jsx", ".tgz"], // Added .tgz to handle xlsx package
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"], // Ensure node_modules is resolved
    fallback: {
      // Fallback for xlsx if needed (optional, depending on runtime)
      fs: false,
    },
  },
  devServer: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
};
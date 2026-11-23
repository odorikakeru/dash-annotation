const path = require("path");

module.exports = (env = {}) => {
  const production = Boolean(env.production);

  return {
    mode: production ? "production" : "development",
    entry: "./src/index.ts",
    output: {
      path: path.resolve(__dirname, "dash_konva_annotation"),
      filename: production
        ? "dash_konva_annotation.min.js"
        : "dash_konva_annotation.dev.js",
      library: {
        name: "dash_konva_annotation",
        type: "umd",
      },
      globalObject: "this",
    },
    externals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
  };
};

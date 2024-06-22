const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const createEnvironmentHash = require("./webpack/persistentCache/createEnvironmentHash");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Define paths
const paths = {
  appIndexJs: "./src/index.js",
  appBuild: path.resolve(__dirname, "build"),
  publicUrlOrPath: "/",
  appHtml: "./public/index.html",
  appWebpackCache: path.resolve(__dirname, "node_modules", ".cache", "webpack"),
  appTsConfig: "./tsconfig.json",
  appJsConfig: "./jsconfig.json",
  appPath: path.resolve(__dirname, "src"),
  swSrc: "./src/service-worker.js",
};

// Function to load environment variables
const getClientEnvironment = (publicPath) => {
  const raw = dotenv.config().parsed;

  // Ensuring all environment variables are strings
  const stringified = {
    "process.env": Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
    "process.env.PUBLIC_URL": JSON.stringify(publicPath),
  };

  return { raw, stringified };
};

module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";
  const isEnvProductionProfile =
    isEnvProduction && process.argv.includes("--profile");

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const shouldUseReactRefresh = env.raw.FAST_REFRESH === "true";

  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve("style-loader"),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: paths.publicUrlOrPath.startsWith(".")
          ? { publicPath: "../../" }
          : {},
      },
      {
        loader: require.resolve("css-loader"),
        options: cssOptions,
      },
      {
        loader: require.resolve("postcss-loader"),
        options: {
          postcssOptions: {
            ident: "postcss",
            config: false,
            plugins: [
              require("postcss-flexbugs-fixes"),
              [
                require("postcss-preset-env"),
                {
                  autoprefixer: {
                    flexbox: "no-2009",
                  },
                  stage: 3,
                },
              ],
              require("postcss-normalize"),
            ],
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean);

    if (preProcessor) {
      loaders.push(require.resolve("resolve-url-loader"), {
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: true,
          root: paths.appSrc,
        },
      });
    }
    return loaders;
  };

  return {
    target: ["browserslist"],
    stats: "errors-warnings",
    mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
    bail: isEnvProduction,
    devtool: isEnvProduction ? "source-map" : "cheap-module-source-map",
    entry: paths.appIndexJs,
    output: {
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? "static/js/[name].[contenthash:8].js"
        : "static/js/bundle.js",
      chunkFilename: isEnvProduction
        ? "static/js/[name].[contenthash:8].chunk.js"
        : "static/js/[name].chunk.js",
      assetModuleFilename: "static/media/[name].[hash][ext]",
      publicPath: paths.publicUrlOrPath,
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, "/")
        : (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
    },
    cache: {
      type: "filesystem",
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: "pack",
      buildDependencies: {
        defaultWebpack: ["webpack/lib/"],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) =>
          fs.existsSync(f),
        ),
      },
    },
    resolve: {
      fallback: {
        assert: require.resolve("assert"),
        util: require.resolve("util"),
        stream: require.resolve("stream-browserify"),
      },
    },
    module: {
      rules: [
        {
          oneOf: [
            // Rules for JS and JSX
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appPath,
              loader: require.resolve("babel-loader"),
              options: {
                presets: [
                  [
                    require.resolve("babel-preset-react-app"),
                    {
                      runtime: hasJsxRuntime ? "automatic" : "classic",
                    },
                  ],
                ],
                plugins: [
                  isEnvDevelopment &&
                    shouldUseReactRefresh &&
                    require.resolve("react-refresh/babel"),
                ].filter(Boolean),
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            // Rules for CSS, PostCSS, and Sass
            {
              test: /\.css$/,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
              }),
              sideEffects: true,
            },
            {
              test: /\.(scss|sass)$/,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                },
                "sass-loader",
              ),
              sideEffects: true,
            },
            // Rules for images, fonts, and other files
            {
              loader: require.resolve("file-loader"),
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: "static/media/[name].[hash:8].[ext]",
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml,
      }),
      new MiniCssExtractPlugin({
        filename: "static/css/[name].[contenthash:8].css",
        chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
        ignoreOrder: true,
      }),
      isEnvProduction &&
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              "default",
              {
                discardComments: { removeAll: true },
              },
            ],
          },
          parallel: true,
          sourceMap: shouldUseSourceMap,
        }),
      new webpack.DefinePlugin(env.stringified),
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      isEnvDevelopment &&
        shouldUseReactRefresh &&
        new ReactRefreshWebpackPlugin({
          overlay: {
            entry: require.resolve("@pmmmwh/react-refresh-webpack-plugin"),
            module: require.resolve("react-refresh/runtime"),
            ignoreWarnings: true,
          },
        }),
    ].filter(Boolean),
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              ascii_only: true,
            },
          },
          sourceMap: shouldUseSourceMap,
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              "default",
              {
                discardComments: { removeAll: true },
              },
            ],
          },
          parallel: true,
          sourceMap: shouldUseSourceMap,
        }),
      ],
      splitChunks: {
        chunks: "all",
        name: false,
      },
    },
  };
};

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    "dist.js" : path.resolve(__dirname, 'app/main.js'),
    "dist.min.js" : path.resolve(__dirname, 'app/main.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: './[name]'
  },
  devtool: 'source-map',
  devServer: {
    historyApiFallback: true,
    watchOptions: { aggregateTimeout: 300, poll: 1000 },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      { test: /\.js[x]?$/, loader: 'babel-loader' }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.scss'],
    alias: {
        stylekit: path.join(__dirname, 'node_modules/sn-stylekit/dist/stylekit.css')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist.css",
      chunkFilename: "[name].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
      { from: './app/index.html', to: 'index.html' },
      { from: './app/index.min.html', to: 'index.min.html' },
    ]})
  ]
};

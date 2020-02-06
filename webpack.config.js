const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    index: './examples/base.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
          plugins: [
            "@babel/plugin-transform-runtime"
          ],
        },
      },
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, "examples"),
    inline: true,
    hot: true,
    before(app){
      app.get('/init.json', function(req, res) {
        res.json({ 
          title: 'init title',
        });
      });
      app.get('/change.json', function(req, res) {
        res.json({ 
          des: 'change des',
        });
      });
    }
  },
}
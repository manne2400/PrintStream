const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: './'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html']
          }
        }
      ]
    })
  ],
  target: 'electron-renderer',
  externals: {
    sqlite3: 'commonjs sqlite3'
  }
}; 
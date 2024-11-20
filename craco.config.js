const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.entry = {
        main: './src/index.js',       // Entry for the main popup page
        options: './src/options.js'   // Entry for the options page
      };

      webpackConfig.output.filename = 'static/js/[name].bundle.js';

      // Configure HtmlWebpackPlugin to create both index.html and options.html
      const htmlPluginIndex = new HtmlWebpackPlugin({
        inject: true,
        chunks: ['main'],
        template: './public/index.html',
        filename: 'index.html',
      });

      const htmlPluginOptions = new HtmlWebpackPlugin({
        inject: true,
        chunks: ['options'],
        template: './public/options.html',
        filename: 'options.html',
      });

      // Remove the existing HtmlWebpackPlugin instance and add the new ones
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => !(plugin instanceof HtmlWebpackPlugin)
      );
      webpackConfig.plugins.push(htmlPluginIndex, htmlPluginOptions);

      return webpackConfig;
    },
  },
};

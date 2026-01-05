const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: ['log'],
              drop_debugger: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
    },
  };
};

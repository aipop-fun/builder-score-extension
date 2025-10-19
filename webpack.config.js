const path = require('path');
const Dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'source-map',
    entry: {
        popup: './src/popup/index.tsx',
        content: './src/content/content.ts',
        github: './src/content/github.ts',
        background: './src/background.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: 'chunks/[name].[contenthash:8].js',
        clean: true,
        publicPath: ''
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        compilerOptions: {
                            noEmit: false
                        }
                    }
                }],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [
                                require('tailwindcss'),
                                require('autoprefixer'),
                            ],
                        },
                    },
                }],
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'style': path.resolve(__dirname, 'src/style'),
            'services': path.resolve(__dirname, 'src/services'),
            'types': path.resolve(__dirname, 'src/types'),
            'config': path.resolve(__dirname, 'src/config'),
            'components': path.resolve(__dirname, 'src/components')
        },
        fallback: {
            "crypto": false,
            "stream": false,
            "assert": false,
            "http": false,
            "https": false,
            "os": false,
            "url": false,
            "zlib": false,
            "buffer": false
        }
    },
    plugins: [
        new Dotenv({ 
            systemvars: true,
            silent: true,
            defaults: false
        }),
        new HtmlWebpackPlugin({
            template: './src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
            inject: 'body'
        }),
        new CopyPlugin({
            patterns: [
                { from: 'src/manifest.json' },
                { from: 'src/style/global.css' },
                { from: 'src/style/styles.css' },
                { from: 'src/style/github.css' },
                { from: 'src/popup/popup.css' },
                { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
                { from: 'img/', to: 'img', noErrorOnMissing: true }
            ]
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: false,
                    },
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
        splitChunks: {
            chunks: 'async',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'async',
                    priority: 10
                },
                common: {
                    minChunks: 2,
                    priority: 5,
                    reuseExistingChunk: true,
                    name: 'common'
                }
            }
        },
        runtimeChunk: false
    },
    ignoreWarnings: [
        {
            module: /node_modules\/@metamask\/sdk/,
        },
        {
            module: /node_modules\/@reown/,
        },
        {
            module: /node_modules\/@walletconnect/,
        },
        {
            message: /Critical dependency: the request of a dependency is an expression/,
        },
        {
            message: /Can't resolve 'pino-pretty'/,
        },
        {
            message: /Can't resolve 'lokijs'/,
        },
        {
            message: /Can't resolve 'encoding'/,
        },
    ],
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
}
const expoConfig = require('@expo/webpack-config')
const htmlInlineScriptPlugin = require('html-inline-script-webpack-plugin')

// Expo expects a function so we can pass around options.
module.exports = async function (env, argv) {
  const defaultExpo = await expoConfig(env, argv)

  // Non-Production builds should return the default config
  if (env.mode !== 'production') {
    return defaultExpo
  }

  /**
   * This plugin allows us to inline everything into a single index.html file
   * which is needed for expo to serve a single file for a WebView locally.
   */
  const InlineScriptPlugin = new htmlInlineScriptPlugin()

  // Destructure the array to pick what we need.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [
    CleanWebpackPlugin,
    CopyPlugin,
    HtmlWebpackPlugin,
    InterpolateHtmlPlugin,
    ExpoPwaManifestWebpackPlugin,
    FaviconWebpackPlugin,
    ApplePwaWebpackPlugin,
    ChromeIconsWebpackPlugin,
    ModuleNotFoundPlugin,
    DefinePlugin,
    MiniCssExtractPlugin,
    ManifestPlugin,
    WebpackBar
  ] = defaultExpo.plugins

  const merged = {
    ...defaultExpo,
    plugins: [
      CleanWebpackPlugin,
      CopyPlugin,
      HtmlWebpackPlugin,
      InterpolateHtmlPlugin,
      ModuleNotFoundPlugin,
      DefinePlugin,
      MiniCssExtractPlugin,
      ManifestPlugin,
      WebpackBar,
      InlineScriptPlugin
    ]
  }

  return merged
}

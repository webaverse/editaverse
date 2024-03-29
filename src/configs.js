import editorIcon from "./assets/editor-icon.png";

// Read configs from meta tags if available, otherwise use the process.env injected from build.
const configs = {};
const get = (configs, key, defaultValue) => {
  const el = document.querySelector(`meta[name='env:${key.toLowerCase()}']`);
  if (el) {
    configs[key] = el.getAttribute("content");
  } else {
    configs[key] = defaultValue;
  }
};

get(configs, "SERVER_URL", process.env.SERVER_URL);
get(configs, "HUBS_SERVER", process.env.HUBS_SERVER);
get(configs, "RETICULUM_SERVER", process.env.RETICULUM_SERVER);
get(configs, "THUMBNAIL_SERVER", process.env.THUMBNAIL_SERVER);
get(configs, "CORS_PROXY_SERVER", process.env.CORS_PROXY_SERVER);
get(configs, "NON_CORS_PROXY_DOMAINS", process.env.NON_CORS_PROXY_DOMAINS);
get(configs, "SENTRY_DSN", process.env.SENTRY_DSN);
get(configs, "GA_TRACKING_ID", process.env.GA_TRACKING_ID);
get(configs, "BASE_ASSETS_PATH", process.env.BASE_ASSETS_PATH);
get(configs, "DISCORD_CLIENT_ID", process.env.DISCORD_CLIENT_ID);
get(configs, "DISCORD_CLIENT_SECRET", process.env.DISCORD_CLIENT_SECRET);
get(configs, "DISCORD_REDIRECT", process.env.DISCORD_REDIRECT);
get(configs, "DISCORD_AUTHORIZATION_URL", process.env.DISCORD_AUTHORIZATION_URL);

if (configs.BASE_ASSETS_PATH) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = configs.BASE_ASSETS_PATH;
}

function fixBaseAssetsPath(path) {
  // eslint-disable-next-line no-undef
  if (!path.startsWith(__webpack_public_path__)) {
    // eslint-disable-next-line no-useless-escape
    const matches = path.match(/^([^\/]+\/).+$/);

    if (matches.length > 1) {
      // eslint-disable-next-line no-undef
      return __webpack_public_path__ + path.replace(matches[1], "");
    }
  }

  return path;
}

configs.name = "Webaverse Editor";
configs.longName = "Webaverse Editor";
configs.icon = () => fixBaseAssetsPath(editorIcon);

export default configs;

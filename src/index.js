import configs from "./configs";
import ReactDom from "react-dom/client";
import React from "react";
import * as Sentry from "@sentry/browser";
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";
import App from "./ui/App";
import Api from "./api/Api";
import { initTelemetry } from "./telemetry";

if (configs.SENTRY_DSN) {
  Sentry.init({
    dsn: configs.SENTRY_DSN,
    release: process.env.BUILD_VERSION,
    integrations(integrations) {
      return integrations.filter(integration => integration.name !== "Breadcrumbs");
    }
  });
}

initTelemetry();

// eslint-disable-next-line no-undef
console.info(`Spoke version: ${process.env.BUILD_VERSION}`);

const api = new Api();
const container = document.getElementById("app");
const root = ReactDom.createRoot(container);

root.render(<App api={api} />);

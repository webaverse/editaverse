const cors_proxy = require("cors-anywhere");
const cors_proxy2 = require("cors-anywhere");
const fs = require("fs");
const path = require("path");

// Listen on a specific host via the HOST environment variable
const host = process.env.CORS_HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
const port = process.env.CORS_PORT || 8080;
const port2 = process.env.CORS_PORT_TWO || 8081;

const key = fs.readFileSync(path.join(__dirname, "certs", "privkey.pem"));
const cert = fs.readFileSync(path.join(__dirname, "certs", "cert.pem"));

cors_proxy2
  .createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ["origin", "x-requested-with"],
    removeHeaders: ["cookie", "cookie2"]
  })
  .listen(8081, host, function() {
    console.log("Running CORS Anywhere on " + host + ":" + port2);
  });

cors_proxy
  .createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ["origin", "x-requested-with"],
    removeHeaders: ["cookie", "cookie2"],
    httpsOptions: {
      key,
      cert
    }
  })
  .listen(port, host, function() {
    console.log("Running CORS Anywhere on " + host + ":" + port);
  });

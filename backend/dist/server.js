"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const app = (0, app_1.createApp)();
app.listen(config_1.config.port, () => {
    console.log(`TrySnap backend listening on http://localhost:${config_1.config.port}`);
});

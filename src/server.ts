import http from "http";
import express from "express";
import next from "next";
import debugInit from "debug";

import ConfigService from "./server/services/configService";
import { DEFAULT_PORT, APP_NAME } from "./server/config/constants";
import { stringifyError } from "./server/util/helpers";

const log = debugInit(process.env.INSTANCE_NAME || APP_NAME);

const config = ConfigService.instantiate("DevInstance");

testConfigService(config);

const PORT = parseInt(process.env.PORT || DEFAULT_PORT, 10);
const DEV = process.env.NODE_ENV !== "production";
const APP = next({ dev: DEV });
const HANDLE = APP.getRequestHandler();

APP.prepare().then(() => {
    const SERVER = express();

    SERVER.get("/testroute", (req, res) => {
        res.send("test route");
    });

    SERVER.get("/{*splat}", (req, res) => {
        return HANDLE(req, res);
    });

    http.createServer(SERVER).listen(PORT, () => {
        log(
            `Server listening on http://localhost:${PORT} in ${DEV ? "development" : process.env.NODE_ENV} mode.`,
        );
    });
});

//TODO: Break this out when unit tests are implemented
function testConfigService(config: ConfigService) {
    try {
        log(
            config.get("trackedExtensions"),
            config.get("trackedExtensions").pathFragments,
        );
    } catch (e) {
        log(stringifyError(e));
    }
    try {
        log(config.get("enableThumbnailCache"));
    } catch (e) {
        log(stringifyError(e));
    }
    try {
        config.set("badKey", true);
    } catch (e) {
        log(stringifyError(e));
    }
    try {
        config.set("trackedExtensions", {
            whitelist: false,
            pathFragments: ["mpv", "json"],
        });
    } catch (e) {
        log(stringifyError(e));
    }
}

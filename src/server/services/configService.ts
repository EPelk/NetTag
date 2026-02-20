import Conf from "conf";
import debugInit, { Debugger } from "debug";

import { isValidFilename } from "../util/validation";
import { APP_NAME } from "../config/constants";
import { SettingTableData } from "../types/settingTypes";
import { settingTable } from "../models/serversettings/settingsModel";
import { parseEnv, stringify, stringifyError } from "../util/helpers";

const log = debugInit("ConfigService");

// TODO: Evaluate whether singleton pattern is necessary here once consuming code is more fleshed out

// TODO: Define custom error classes to facilitate response error messages for API

// TODO: Document functions

export default class ConfigService {
    static #constructorCalledInternally: boolean = false;
    static #instance: ConfigService;
    #config: Conf;
    #setterLog: Debugger;
    #getterLog: Debugger;
    get;

    /**
     * Singleton constructor for the ConfigService. Creates a new instance if
     * none exists; else returns the existing instance.
     *
     * The config file is stored at `.../[constants.APP_NAME]/[instanceName].conf`
     * @param {string} instanceName Unique name for this instance of the app.
     *                              Used for the config file name to differentiate
     *                              multiple instances of NetTag running on the
     *                              same machine. Must be a legal file name.
     * @returns
     */
    constructor(instanceName: string) {
        const constructorLog = log.extend("Constructor");
        this.#setterLog = log.extend("Set");
        this.#getterLog = log.extend("Get");

        if (!ConfigService.#constructorCalledInternally) {
            throw new TypeError(
                "ConfigService is not externally constructable. Call instantiate() instead.",
            );
        }
        ConfigService.#constructorCalledInternally = false;

        if (!(typeof instanceName === "string") || !isValidFilename(APP_NAME)) {
            throw new TypeError("APP_NAME must be a legal directory name.");
        }

        if (
            !(typeof instanceName === "string") ||
            !isValidFilename(instanceName)
        ) {
            throw new TypeError(
                "ConfigService must have a valid instance name.",
            );
        }

        constructorLog("Creating new ConfigService instance.");
        this.#config = new Conf({
            projectName: APP_NAME,
            configName: instanceName,
        });
        // this.get = this.#buildGetter(Object.entries(settingTable.getTable()).map((setting) => ({name: setting[0], ...setting[1]})), settingTable.getTable());
        this.get = this.#buildGetter(settingTable.getTable());
    }

    static instantiate(instanceName: string): ConfigService {
        const instantiateLog = log.extend("Instaniate");
        if (this.#instance !== undefined) {
            instantiateLog(
                "ConfigService already initialized. Returning existing instance.",
            );
        } else {
            this.#constructorCalledInternally = true;
            this.#instance = new ConfigService(instanceName);
            instantiateLog("Returning new instance.");
        }
        return ConfigService.#instance;
    }

    set(key: string, value: unknown): void {
        if (settingTable.hasKey(key)) {
            const setting = settingTable.getSetting(key);
            if (setting.validate(value)) {
                this.#config.set(key, value);
                this.#setterLog(`Set ${key} to value ${stringify(value)}.`);
            } else {
                const err_msg = `Cannot set ${key}: Received value ${stringify(value)} does not match expected shape ${setting.shapeDebugStr}.`;
                const err = new TypeError(err_msg);
                this.#setterLog(stringifyError(err));
                throw err;
            }
        } else {
            // key was not a valid key in settingTable
            const err_msg = `${key} is not a valid key in the setting table.`;
            const err = new TypeError(err_msg);
            this.#setterLog(stringifyError(err));
            throw err;
        }
    }

    #buildGetter<Settings extends SettingTableData>(table: Settings) {
        // Type `Settings` is narrowed to the specific implementation in parameter `table`
        // Return a getter that narrows to a specific setting in the table based on `key`
        return <
            SettingKey extends keyof Settings,
            DataType extends ReturnType<Settings[SettingKey]["cast"]>,
        >(
            key: SettingKey,
        ): DataType => {
            const configVal = this.#config.get(String(key));
            const value = configVal ?? parseEnv(table[key].envVar);
            this.#getterLog(
                `Reading from ${configVal === undefined ? `environment variable ${table[key].envVar}` : `${this.#config.path}:${String(key)}`}...`,
            );
            try {
                const returnVal = table[key].cast(value) as DataType;
                this.#getterLog(`Validation complete. Returning value ${stringify(returnVal)}.`);
                return returnVal;
            } catch (e) {
                this.#getterLog(stringifyError(e));
                throw e;
            }
        };
    }
}

/* Uncomment the below to check if type narrowing is broken
(compiler complains about testData.extensions) */
// const config = ConfigService.instantiate('testConf');
// const testData = config.get('trackedExtensions');
// console.log(testData.extensions);

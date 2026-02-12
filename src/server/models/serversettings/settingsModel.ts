import { isObject, isValidFilename } from "../../util/validation";
import { ObjectKey } from "../../types/utilityTypes";
import {
    TrackedExtensionsShape,
    EnableThumbnailCacheShape,
    SettingTable,
} from "../../types/settingTypes";
import { stringify } from "../../util/helpers";

export { settingTable };

/**
 * Builds an object of type `Setting` with the provided properties. The `cast()`
 * function is generated from the provided validation function and data shape.
 * @param validateFn Type guard function to verify that `data` is the correct
 *                   shape for the setting.
 * @param envVar     Name of the setting's corresponding environment variable.
 * @param shapeDebugStr String describing the setting's value's intended shape.
 * @returns An object of type `Setting`.
 */
const buildSettingType = <DataShape>(
    validateFn: (data: unknown) => data is DataShape,
    envVar: string,
    shapeDebugStr: string,
) => {
    return {
        validate: validateFn,
        cast: (data: unknown): DataShape => {
            if (validateFn(data)) {
                return data;
            } else {
                throw new TypeError(
                    `Cast failed: value ${stringify(data)} does not match expected shape ${shapeDebugStr}.`,
                );
            }
        },
        envVar: envVar,
        shapeDebugStr: shapeDebugStr,
    };
};

// TODO: Update this documentation to reflect current behavior
/**
 * @typedef {Object} ConcreteSettingTable
 * @property {function} hasKey - Tests whether the table contains a setting
 *                               with a given key.
 * @property {function} getSetting - Returns the setting for a given key.
 */

/**
 * A function to convert a generic SettingTable into a getter function with
 * concrete return types (and thus type narrowing) on its validate() functions.
 * @param {SettingTable} table The SettingTable to use.
 * @returns {ConcreteSettingTable} The concrete setting table.
 */
function createSettingTable<Settings extends SettingTable>(table: Settings) {
    // Based on https://stackoverflow.com/a/76291341

    // Build table functions
    const hasKey = <SettingKey extends keyof Settings>(
        key: ObjectKey,
    ): key is SettingKey => {
        return Object.keys(table).includes(String(key));
    };
    const getSetting = <SettingKey extends keyof Settings>(
        targetSetting: SettingKey,
    ): Settings[SettingKey] => {
        return table[targetSetting];
    };
    const getKeys = () => {
        return Object.keys(table);
    };

    // Return table
    return {
        getSetting,
        hasKey,
        getKeys,
        getTable: (): Settings => table,
    };
}

const settingTable = createSettingTable({
    /**
     * File extensions to be tracked or ignored by the server.
     *
     * Expected shape of request data:
     * ```
     * {
     *   whitelist: boolean,
     *   extensions: Array<string>
     * }
     * ```
     * @param {boolean} whitelist Whether this is a whitelist of extensions to
     *                            track or a blacklist of extensions to ignore.
     * @param {Array<string>} extensions List of extensions. An empty string
     *                                   denotes that a file has no extension.
     */
    trackedExtensions: buildSettingType<TrackedExtensionsShape>(
        (data): data is TrackedExtensionsShape => {
            // Test if data is an object. If it is, assert its properties
            // and continue validating.
            const dataGuard = (
                obj: unknown,
            ): obj is Partial<TrackedExtensionsShape> => isObject(obj);
            if (dataGuard(data)) {
                return (
                    // data.whitelist exists and is bool
                    typeof data?.whitelist === "boolean" &&
                    // data.extensions is an array
                    Array.isArray(data?.extensions) &&
                    // if data is a whitelist, it cannot be empty
                    !(data.whitelist && data.extensions.length === 0) &&
                    // all extensions are strings and valid filename components (or '').
                    // Do not bother checking for duplicates.
                    data.extensions.every(
                        (ext: unknown) =>
                            typeof ext === "string" &&
                            (isValidFilename(ext) || ext === ""),
                    )
                );
            }
            // data is not an object
            return false;
        },
        "TRACKED_EXTENSIONS", // envVar
        "{ whitelist: boolean; extensions: Array<string> }", // shapeDebugStr
    ),
    enableThumbnailCache: buildSettingType<boolean>(
        (data): data is EnableThumbnailCacheShape => {
            return typeof data === "boolean";
        },
        "ENABLE_THUMBNAIL_CACHE", // envVar
        "boolean", // shapeDebugStr
    ),
});

/* Uncomment the below to check if type narrowing is broken
(compiler complains about testData.extensions) */
// const testData: unknown = { whitelist: true, extensions: ["a", "b"] };

// console.log(settingTable.getSetting("trackedExtensions").cast(testData));
// if (settingTable.getSetting("trackedExtensions").validate(testData)) {
//     console.log(testData.extensions);
// }

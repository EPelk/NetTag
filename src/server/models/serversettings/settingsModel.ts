import { isObject, isValidFilename } from "../../util/validation";
import { ObjectKey } from "../../types/utilityTypes";
import {
    PathFragmentListShape,
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
/**
 * Automate creation of white/blacklist settings for extensions, filenames, and
 * directories since these settings are nearly identical.
 *
 * @param {string} envVar Name of the environment variable for the setting.
 * @param {boolean} allowSubDir Whether to allow slashes (i.e. subdirectories)
 *                              in path fragments.
 * @param {boolean} allowEmptyStr Whether `""` is a valid path fragment.
 * @returns A `Setting` object.
 */
const buildPathFragmentSetting = (
    envVar: string,
    allowSubDir: boolean,
    allowEmptyStr: boolean,
) => {
    return buildSettingType<PathFragmentListShape>(
        (data): data is PathFragmentListShape => {
            // Test if data is an object. If it is, assert its properties
            // and continue validating.
            const dataGuard = (
                obj: unknown,
            ): obj is Partial<PathFragmentListShape> => isObject(obj);
            if (dataGuard(data)) {
                return (
                    // data.whitelist exists and is bool
                    typeof data?.whitelist === "boolean" &&
                    // data.extensions is an array
                    Array.isArray(data?.pathFragments) &&
                    // if data is a whitelist, it cannot be empty
                    !(data.whitelist && data.pathFragments.length === 0) &&
                    // all extensions are strings and valid filename components (or '').
                    // Do not bother checking for duplicates.
                    data.pathFragments.every((ext: unknown) => {
                        // Only allow ext to be empty if allowEmptyStr is set
                        const emtpyStringTest = allowEmptyStr
                            ? ext === ""
                            : false;
                        return (
                            typeof ext === "string" &&
                            (isValidFilename(ext, allowSubDir) ||
                                emtpyStringTest)
                        );
                    })
                );
            }
            // data is not an object
            return false;
        },
        envVar, // envVar
        "{ whitelist: boolean; pathFragments: Array<string> }", // shapeDebugStr
    );
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
     *   pathFragments: Array<string>
     * }
     * ```
     * @param {boolean} whitelist Whether this is a whitelist of extensions to
     *                            track or a blacklist of extensions to ignore.
     * @param {Array<string>} pathFragments List of extensions. An empty string
     *                                      denotes that a file has no extension.
     */
    trackedExtensions: buildPathFragmentSetting("TRACKED_EXTENSIONS", false, true),
    /**
     * Filenames, not including extensions, to be tracked/ignored.
     */
    trackedFilenames: buildPathFragmentSetting("TRACKED_FILENAMES", false, false),
    /**
     * Directories, including nested directories (e.g. foo/bar) to be tracked/ingored.
     */
    trackedDirectories: buildPathFragmentSetting("TRACKED_DIRECTORIES", true, false),
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

/**
 * A user-configurable server setting.
 * @param {function} validate A type guard function that takes arbitrary data
 *                            and tests whether it is of valid shape for the setting.
 * @param {string} envVar Name of the environment variable defining the setting's
 *                        default value.
 */
type Setting<DataTypePredicate, DataType> = {
    readonly validate: (data: unknown) => DataTypePredicate;
    readonly cast: (data: unknown) => DataType;
    readonly envVar: string;
    readonly shapeDebugStr: string;
};

/**
 * A list of generic `Setting` objects.
 * @param {string} settingName The name and API endpoint of the setting.
 */
export type SettingTable = {
    readonly [settingName: string]: Setting<unknown, unknown>;
};

export type PathFragmentListShape = { whitelist: boolean; pathFragments: Array<string> };
export type EnableThumbnailCacheShape = boolean;

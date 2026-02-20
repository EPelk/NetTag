/**
 * A user-configurable server setting.
 * @param {function} validate A type guard function that takes arbitrary data
 *                            and tests whether it is of valid shape for the setting.
 * @param {function} cast Casts input data as the setting's DataType.
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
export type SettingTableData = {
    readonly [settingName: string]: Setting<unknown, unknown>;
};

// TODO: Consider adding regex support to path fragments
export type PathFragment = {
    caseSensitive: boolean;
    interchangeableSlashes: boolean;
    data: string;
};
export type PathFragmentListShape = {
    whitelist: boolean;
    pathFragments: Array<PathFragment>;
};
export type EnableThumbnailCacheShape = boolean;
export type InterchangeableSlashesShape = boolean;

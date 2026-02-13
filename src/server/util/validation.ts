export { isObject, isValidFilename };

/**
 * Tests whether an input is an object, excluding arrays and `null`.
 * @param test_val Potential object to test.
 * @returns {boolean} `true` if `test_val` is an object, `false` otherwise.
 */
const isObject = (test_val: unknown): test_val is object => {
    return (
        typeof test_val === "object" &&
        !Array.isArray(test_val) &&
        test_val !== null
    );
};

/**
 * Tests if a string is a valid filename based on the following rules:
 * - `/` and `\0` characters are forbidden.
 * - `"."`, `".."`, and `""` (empty string) are forbidden filenames.
 *
 * If environment variable `ENFORCE_WINDOWS_FILENAMES` is set, the following
 * rules also apply:
 * - `<`, `>`, `:`, `"`, `\`, `|`, `?`, and `*` are forbidden characters.
 * - ASCII control characters (code points `0` thru `31`) are forbidden.
 * - Filenames cannot end with `.` or `' '` (space).
 *
 * If parameter `allowSubDir` is true, `/` and `\` are allowed as long as they
 * are not the last character in the string.
 * @param {string} testStr String to test.
 * @param {boolean} allowSubDir Whether to allow slashes in path name.
 * @returns {boolean} `true` if valid, `false` otherwise.
 */
const isValidFilename = (
    testStr: string,
    allowSubDir: boolean = false,
): boolean => {
    // Construct windows-exclusive regex string for use in the below function

    // Printable ASCII characters
    const win_forbidden_printable_ascii = allowSubDir
        ? /[<>:"|?*]/
        : /[<>:"\\|?*]/;
    // ASCII control characters (1-31)
    let win_forbidden_control_chars = "";
    for (let i = 1; i <= 31; ++i) {
        win_forbidden_control_chars += String.fromCharCode(i);
    }
    // ' ' or '.' at end of filename
    // Also include '\' in case allowSubDir is true, in which case
    // win_forbidden_printable_ascii does not catch '\'.
    const win_forbidden_suffix = /([\\ \.]$)/;

    const WIN_FORBIDDEN_REGEX = new RegExp(
        win_forbidden_printable_ascii.source +
            "|" +
            `[${win_forbidden_control_chars}]` +
            "|" +
            win_forbidden_suffix.source,
    );

    // Illegal characters on all systems ('\', \0)
    const illegal_chars = allowSubDir ? /\0/ : /[\/\0]/;
    // Illegal suffix on all systems (for purposes of this function)
    const illegal_suffix = /\\$/;

    return (
        // Check empty
        testStr !== "" &&
        // Check reserved directory names
        testStr !== "." &&
        testStr !== ".." &&
        // '/' and NULL bytes are illegal on all systems
        testStr.match(illegal_chars) === null &&
        // Check that file does not end in a slash
        testStr.match(illegal_suffix) === null &&
        // Check windows-exclusive forbidden characters if needed
        (!process.env.ENFORCE_WINDOWS_FILENAMES ||
            testStr.match(WIN_FORBIDDEN_REGEX) === null)
    );
};

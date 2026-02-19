import { parseEnv } from "./helpers";

export {
    isObject,
    isValidFilename,
    hasTraversalSequences,
};

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
 * If `interchangableSlashes` is set, the following applies:
 * - `\` is forbidden.
 *
 * If platform is win32 or env var `ENFORCE_WINDOWS_FILENAMES` is set,
 * the following rules also apply:
 * - `<`, `>`, `:`, `"`, `\`, `|`, `?`, and `*` are forbidden characters.
 * - ASCII control characters (code points `0` thru `31`) are forbidden.
 * - Filenames cannot end with `.` or `' '` (space).
 *
 * If parameter `allowSubDir` is true, `/` and `\` are allowed, overriding
 * the above rules.
 * @param {string} testStr String to test.
 * @param {boolean} allowSubDir Whether to allow slashes in path name.
 * @param {boolean} interchangableSlashes Whether to treat '/' and '\' as the same, even if
 *                                        '\' would otherwise be allowed.
 * @returns {boolean} `true` if valid, `false` otherwise.
 */
const isValidFilename = (
    testStr: string,
    allowSubDir: boolean = false,
    interchangableSlashes: boolean = true,
): boolean => {
    // Whether to block characters that are illegal in Windows
    const enforceWindowsRules =
        process.platform === "win32" ||
        parseEnv("ENFORCE_WINDOWS_FILENAMES") === true;

    // Determine which characters to block

    // Handle directory separators
    // Trailing slashes (e.g. 'foobar/') are treated the same as internal slashes
    let blockedSlashes = "";
    // Only block slashes if subdirectories are not allowed
    if (!allowSubDir) {
        // '/' is a directory separator on all systems
        blockedSlashes += "\\/";
        // Block '\' if windows rules are enforced or slashes are treated as interchangeable
        if (enforceWindowsRules || interchangableSlashes) {
            // String interpretation reduces this to '\\' before regex initialization kicks in
            blockedSlashes += "\\\\";
        }
    }

    // Handle windows-exclusive illegal characters
    let winForbiddenInternal = "";
    let winForbiddenSuffix = "";
    if (enforceWindowsRules) {
        // Printable ASCII characters
        winForbiddenInternal += '<>:\"|?*';
        // ASCII control characters (1-31)
        for (let i = 1; i <= 31; ++i) {
            winForbiddenInternal += String.fromCharCode(i);
        }
        // ' ' or '.' at end of filename
        // Since this only applies at the end of a file name, create a separate
        // regex capturing group and add a union operator.
        winForbiddenSuffix = "|([ \.]$)";
    }

    /* Construct regex matching any illegal character as calculated above.
       Takes one of the following forms:
       - /[\0]/                                  (block only Unix forbidden; subdirs allowed)
       - /[\0\\]/                                (block only Unix forbidden; subdirs blocked)
       - /[\0\/\\]/                              (block only Unix forbidden; subdirs blocked; slashes interchangable)
       - /[\0<>:"|?*{ASCII 1-31}]|([ \.]$)/      (block win forbidden; subdirs allowed)
       - /[\0\/\\<>:"|?*{ASCII 1-31}]|([ \.]$)/  (block win forbidden; subdirs blocked)
    */
    const illegalChars = new RegExp(
        `[\0${blockedSlashes}${winForbiddenInternal}]${winForbiddenSuffix}`,
    );

    // Perform validity checks
    return (
        // Check empty
        testStr !== "" &&
        // Check reserved directory names
        testStr !== "." &&
        testStr !== ".." &&
        // Check all others
        testStr.match(illegalChars) === null
    );
};

/**
 * Tests whether a string contains `./` or `../`, which can be used in path traversal attacks.
 * Note that this will not detect URL encoded sequences (e.g. %2e%2e%2f).
 *
 * @param {string} testStr String to test.
 * @param {boolean} checkWindowsSequences Whether to also check for `.\` and `..\`.
 * @returns Whether `testStr` contains traversal sequences.
 */
const hasTraversalSequences = (
    testStr: string,
    checkWindowsSequences: boolean = true,
): boolean => {
    const nixMatch = testStr.match(/(\.\/)|(\.\.\/)/);
    const winMatch = testStr.match(/(\.\\)|(\.\.\\)/);
    return nixMatch !== null || (checkWindowsSequences && winMatch !== null);
};

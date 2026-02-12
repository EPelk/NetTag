export {
    isObject,
    isValidFilename
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

// Construct windows-exclusive regex string for use in the below function

// Printable ASCII characters
const win_forbidden_printable_ascii = /[<>:"\\|?*]/;
// ASCII control characters (1-31)
let win_forbidden_control_chars = "";
for (let i = 1; i <= 31; ++i) {
    win_forbidden_control_chars += String.fromCharCode(i);
}
// ' ' or '.' at end of filename
const win_forbidden_suffix = /([ \.]$)/;

const WIN_FORBIDDEN_REGEX = new RegExp(
    win_forbidden_printable_ascii.source +
        "|" +
        `[${win_forbidden_control_chars}]` +
        "|" +
        win_forbidden_suffix.source,
);

/**
 * Tests if a string is a valid filename based on the following rules:
 * - `/` and `\0` characters are forbidden.
 * - `"."`, `".."`, and `""` (empty string) are forbidden filenames.
 *
 * If environment variable `ENFORCE_WINDOWS_FILENAMES` is set, the following
 * rules also apply:
 * - `<`, `>`, `:`, `"`, `/`, `|`, `?`, and `*` are forbidden characters.
 * - ASCII control characters (code points `0` thru `31`) are forbidden.
 * - Filenames cannot end with `.` or `' '` (space).
 * @param {string} test_str String to test.
 * @returns {boolean} `true` if valid, `false` otherwise.
 */
const isValidFilename = (test_str: string): boolean => {
    return (
        // Check empty
        test_str !== "" &&
        // Check reserved directory names
        test_str !== "." &&
        test_str !== ".." &&
        // '/' and NULL bytes are illegal on all systems
        test_str.match(/[\/\0]/) === null &&
        // Check windows-exclusive forbidden characters if needed
        (!process.env.ENFORCE_WINDOWS_FILENAMES ||
            test_str.match(WIN_FORBIDDEN_REGEX) === null)
    );
};

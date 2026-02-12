export { parseEnv, stringify, stringifyError };

/**
 * Parse an environment variable as JSON.
 * @param {string} key Name of the environment variable.
 * @returns Parsed data or `null` if the variable doesn't exist.
 */
const parseEnv = (key: string): unknown => {
    return JSON.parse(process.env[key] ?? "null");
};

/**
 * Wrapper on `JSON.stringify` to provide a simpler interface for general use.
 * @param value The value to stringify
 * @param {string | number | undefined} space `JSON.stringify`'s `space` argument.
 *                                            Defaults to `" "`.
 * @param {boolean} useNewlines Whether to spread output across multiple lines.
 * @returns {string} The stringified value.
 */
const stringify = (
    value: unknown,
    space: string | number | undefined = " ",
    useNewlines: boolean = false,
): string => {
    let outStr = JSON.stringify(value, null, space);
    if (space !== undefined && !useNewlines) {
        // All newline chars except the last one are padded with whitespace.
        // The last `\n` is formatted as [JSON content]\n} and therefore requires special treatment.
        const endNewlineReplacer =
            typeof space === "string" ? space : " ".repeat(space);
        // Nested structures have extra padding, which needs to be pruned.
        const wideNewline =
            typeof space === "string"
                ? new RegExp(`\n[${space}]+`, "g")
                : /\n[ ]+/g;
        const wideReplacer =
            typeof space === "string" ? space : " ".repeat(space);
        outStr = outStr
            .replace("\n}", `${endNewlineReplacer}}`)
            .replaceAll(wideNewline, wideReplacer)
            .replaceAll("\n", "");
    }
    return outStr;
};

/**
 * Stringify the error passed to a `catch` block.
 * @param e Argument of `catch` block.
 * @returns String version of `e`.
 */
const stringifyError = (e: unknown): string => {
    if (e instanceof Error) {
        return e.stack ?? `${e.name}: ${e.message}`;
    } else {
        return String(e);
    }
};

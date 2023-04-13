/**
 * Check if all keys in an object are defined.
 * @param body The object to check.
 * @param keys The keys to check.
 * @returns True if all keys are defined, false otherwise.
 */
export function checkBody(body: any, ...keys: string[]): boolean {
    for (const key of keys) {
        if (body[key] === undefined) {
            return false;
        }
    }
    return true;
};
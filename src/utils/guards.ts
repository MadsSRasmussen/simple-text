export function indexIsValid(index: number, min: number, max: number): boolean {
    return !(index < min || index > max);
}
import { ParagraphObject, FormatObject, TextObject } from "../types";

export function indexIsValid(index: number, min: number, max: number): boolean {
    return !(index < min || index > max);
}

export function documentNodeHasChildren(node: ParagraphObject | FormatObject | TextObject): node is ParagraphObject | FormatObject {
    return 'children' in node;
}

export function documentNodeIsTextNode(node: ParagraphObject | FormatObject | TextObject): node is TextObject {
    return node.type === 'text';
}
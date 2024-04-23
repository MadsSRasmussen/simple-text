import Document from "../models/document-model";
import { ParagraphObject, FormatObject, TextObject, DocumentVector } from "../types";

export function indexIsValid(index: number, min: number, max: number): boolean {
    return !(index < min || index > max);
}

export function documentNodeHasChildren(node: ParagraphObject | FormatObject | TextObject): node is ParagraphObject | FormatObject {
    return 'children' in node;
}

export function documentNodeIsTextNode(node: ParagraphObject | FormatObject | TextObject): node is TextObject {
    return node.type === 'text';
}

export function documentNodeIsFormatNode(node: ParagraphObject | FormatObject | TextObject): node is FormatObject {
    return node.type === 'format';
}

export function documentNodeIsParagraphNode(node: ParagraphObject | FormatObject | TextObject): node is ParagraphObject {
    return node.type === 'paragraph';
}

export function selectionIsWithinElement(selection: Selection, element: Node): boolean {
    return (selection.rangeCount > 0 && element.contains(selection.getRangeAt(0).commonAncestorContainer));
}

export function documentNodeIsFirstTextNodeOfParagraph(vector: DocumentVector): boolean {

    const paragraphPath = vector.path.slice(1);

    for (let i = 0; i < paragraphPath.length; i++) {
        if (paragraphPath[i] !== 0) {
            return false;
        }
    }

    return true;

}

export function documentNodeIsLastTextNodeOfParagraph(vector: DocumentVector, paragraph: ParagraphObject): boolean {

    const paragraphPath = vector.path.slice(1);

    let node: ParagraphObject | FormatObject | TextObject = paragraph;

    const childrensLengths = [];

    // Create an array of lengths - 1 of children array in each child:
    while(documentNodeHasChildren(node)) {
        childrensLengths.push(node.children.length - 1);
        node = node.children[node.children.length - 1]
    }

    // Checks equality of this children length array with paragraph path
    if (paragraphPath.length !== childrensLengths.length) { return false }

    for (let i = 0; i < paragraphPath.length; i++) {
        if (paragraphPath[i] !== childrensLengths[i]) { return false }
    }

    return true;

}
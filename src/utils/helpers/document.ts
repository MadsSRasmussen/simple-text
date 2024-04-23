import { DocumentVector, FormatFlags, FormatObject, ParagraphObject, TextObject, format } from "../../types";

export function generateTextObject(content: string = ''): TextObject {

    return {
        type: 'text',
        content: content
    }

}

export function generateFormatObject(format: format, content: string = ''): FormatObject {

    return {
        type: 'format',
        format: format,
        children: [generateTextObject(content)]
    }

}

export function generateFormatFlagsObject(): FormatFlags {
    return {
        strong: false,
        em: false,
        u: false,
        title: false,
    }
}

export function getIndexOfChildInParentChildrenArray(parent: ParagraphObject | FormatObject, child: ParagraphObject | FormatObject | TextObject): number {
    for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i] === child) { return i };
    }
    throw new Error('Child was not found in parent child array.');
}

// Checks document vector deep equality
export function documentVectorsAreDeeplyEqual(firstVector: DocumentVector, secondVector: DocumentVector): boolean {

    if (firstVector.index !== secondVector.index) { return false };
    if (firstVector.path.length !== secondVector.path.length) { return false };

    for (let i = 0; i < firstVector.path.length; i++) {
        if (firstVector.path[i] !== secondVector.path[i]) { return false };
    }

    return true;

}

export function arraysAreDeeplyEqual(firstArray: any[], secondArray: any[]): boolean {

    if (firstArray.length !== secondArray.length) { return false };

    for (let i = 0; i < firstArray.length; i++) {
        if (firstArray[i] !== secondArray[i]) { return false };
    }

    return true;

}

export function generateNestedTextObject(formats: format[], content: string = ''): { node: TextObject | FormatObject, textNodePath: number[] } {

    const path: number [] = [];

    let node: TextObject | FormatObject = generateTextObject(content);

    formats.forEach(format => {

        path.push(0);
        node = generateFormatObjectWithChild(node, format);

    })

    return { node: node, textNodePath: path };

}

function generateFormatObjectWithChild(child: TextObject | FormatObject, format: format): FormatObject {
    return {
        type: 'format',
        format: format,
        children: [child]
    }
}
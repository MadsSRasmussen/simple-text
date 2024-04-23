// Datasctructure types:
export type command = 'bold' | 'itallic' | 'underline' | 'insertParagraph' | 'deleteChatacter';

export type format = 'strong' | 'em' | 'u' | 'title';

export type FormatFlags = Record<format, boolean>;

export interface TextObject {
    type: 'text';
    content: string;
}

export interface FormatObject {
    type: 'format';
    format: format;
    children: [FormatObject | TextObject, ...(FormatObject | TextObject)[]];
}

export interface ParagraphObject {
    type: 'paragraph';
    children: [FormatObject | TextObject, ...(FormatObject | TextObject)[]];
}

export interface DocumentVector {
    path: number[];
    index: number;
}

export interface CarretPosition {
    x: number,
    y: number;
}

export interface SelectionRange {
    start: DocumentVector,
    end: DocumentVector
}
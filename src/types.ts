// Datasctructure types:
export type command = 'bold' | 'itallic' | 'underline';

type format = 'strong' | 'em' | 'u';

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
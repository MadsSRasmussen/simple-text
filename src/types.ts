// Datasctructure types:
type Format = 'strong' | 'em' | 'u';

export interface TextObject {
    type: 'text';
    content: string;
}

export interface FormatObject {
    type: 'format';
    format: Format;
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
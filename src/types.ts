// Datasctructure types:
type Format = 'strong' | 'itallic' |'underlined';

export interface TextObject {
    type: 'text';
    content: String;
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
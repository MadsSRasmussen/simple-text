import { DocumentVector, FormatObject, ParagraphObject, TextObject } from "../types.js";
import { indexIsValid, documentNodeHasChildren, documentNodeIsTextNode } from "../utils/guards.js";

class Document {

    public paragraphs: ParagraphObject[];

    constructor() {
        this.paragraphs = this.init()
    }

    private init(): ParagraphObject[] {
        
        const initialText: TextObject = {
            type: 'text',
            content: ''
        }

        const initialParagraph: ParagraphObject = {
            type: 'paragraph',
            children: [initialText]
        }

        return [initialParagraph];

    }

    public toString(): string {
        return JSON.stringify(this);
    }
    
}

export default Document;
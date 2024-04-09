import { ParagraphObject, TextObject } from "../types";

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

    public toString(): String {
        return JSON.stringify(this);
    }

}

export default Document;
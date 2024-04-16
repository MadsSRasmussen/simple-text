import { DocumentVector, FormatObject, ParagraphObject, TextObject } from "../types.js";

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

    public getTextNode(vector: DocumentVector): TextObject {

        const copiedVector: DocumentVector = { ...vector };

        const paragraphIndex = copiedVector.path[0]

        // If the result of copiedVector.path.shift() is undefined, the array must have a length 0;
        if (paragraphIndex === undefined) {
            throw new Error(`The result of vector.path.shift() was undefined vector.path has a length of ${copiedVector.path.length}`);
        }

        const paragraph: ParagraphObject = this.paragraphs[paragraphIndex]

        let node: ParagraphObject | FormatObject | TextObject = paragraph;

        function hasChildren(node: ParagraphObject | FormatObject | TextObject): node is ParagraphObject | FormatObject {
            return 'children' in node;
        }

        function isTextNode(node: ParagraphObject | FormatObject | TextObject): node is TextObject {
            return node.type === 'text';
        }

        for (let i = 1; i < copiedVector.path.length; i++) {

            const index = copiedVector.path[i];

            if (hasChildren(node)) {

                node = node.children[index]
                continue;

            } else {

                if (i !== copiedVector.path.length) {
                    throw new Error(`Node without children encountered before end of vector.path`);
                }

            }

        }

        if (isTextNode(node)) {
            return node;
        } else {
            throw new Error(`Resulting node was of type ${node.type}`);
        }

    }

}

export default Document;
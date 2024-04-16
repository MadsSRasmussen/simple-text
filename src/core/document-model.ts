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

    public getTextNode(vector: DocumentVector): TextObject {

        const copiedVector: DocumentVector = { ...vector };

        const paragraphIndex = copiedVector.path[0]

        // If the result of copiedVector.path.shift() is undefined, the array must have a length 0;
        if (paragraphIndex === undefined) {
            throw new Error(`The result of vector.path.shift() was undefined vector.path has a length of ${copiedVector.path.length}`);
        }

        const paragraph: ParagraphObject = this.paragraphs[paragraphIndex]

        let node: ParagraphObject | FormatObject | TextObject = paragraph;

        for (let i = 1; i < copiedVector.path.length; i++) {

            const index = copiedVector.path[i];

            if (documentNodeHasChildren(node)) {

                node = node.children[index]
                continue;

            } else {

                if (i !== copiedVector.path.length) {
                    throw new Error(`Node without children encountered before end of vector.path`);
                }

            }

        }

        if (documentNodeIsTextNode(node)) {
            return node;
        } else {
            throw new Error(`Resulting node was of type ${node.type}`);
        }

    }

    public getPreviousVector(vector: DocumentVector): DocumentVector {

        const textNode = this.getTextNode(vector);
        
        // Check if index - 1 is out of range of the initial textNode
        if (indexIsValid(vector.index - 1, 0, textNode.content.length)) {
            return { path: [...vector.path], index: vector.index - 1}
        }

        // Recursive function: 1 generation up - check if path is > 0, if it is, continue along this path with max-index, values, until text-node is reached.
        const copiedPath = [...vector.path];

        const test = (path: number[]): DocumentVector => {

            if (path[path.length - 1] > 0) {
                const localPath = [...path];
                // Set last element of copied path to one less, and get endNode from this
                localPath[localPath.length - 1] = localPath[localPath.length - 1] - 1;
                return this.getTrailingNodeVector(localPath);
            } else {

                if (path.length == 1) {
                    throw new Error(`Unable to find previous vector`);
                }
                path.pop();
                return test(path)
            }

        }

        return test(copiedPath);

    }

    private getTrailingNodeVector(path: number[]): DocumentVector {

        const localPath = [...path];

        let node: ParagraphObject | FormatObject | TextObject = this.paragraphs[localPath[0]];

        for (let i = 1; i < localPath.length; i++) {
            if (documentNodeHasChildren(node)) {

                node = node.children[localPath[i]]
                continue;

            } else {
                if (i !== localPath.length - 1) {
                    throw new Error(`Node without children encountered before end of vector.path`);
                }
            }
        }

        const nodeVector: DocumentVector = findLastTrailing(node);

        return nodeVector;

        function findLastTrailing(node: ParagraphObject | FormatObject | TextObject): DocumentVector {

            if (documentNodeIsTextNode(node)) {
                return {
                    path: localPath,
                    index: node.content.length
                }
            }

            if (!documentNodeHasChildren(node)) {
                throw new Error(`Node was not of type TextNode and had no children`)
            }

            return findLastTrailing(getNextTrailing(node));

        }

        function getNextTrailing(node: ParagraphObject | FormatObject): ParagraphObject | FormatObject | TextObject {
            localPath.push(node.children.length - 1);
            return node.children[node.children.length - 1];
        }

    }

    public getNextVector(vector: DocumentVector): DocumentVector {
        
        const textNode = this.getTextNode(vector);
    
        // Check if index + 1 is within the range of the current textNode's content
        if (indexIsValid(vector.index + 1, 0, textNode.content.length)) {
            return { path: [...vector.path], index: vector.index + 1};
        }
    
        const copiedPath = [...vector.path];
    
        for (let i = copiedPath.length - 1; i > 0; i--) {

            const childIndex = copiedPath.pop();

            if (childIndex === undefined) {
                throw new Error(`path.pop() resulted in undefined`)
            }

            const parentNode = this.getNodeByPath(copiedPath);
            if (!documentNodeHasChildren(parentNode)) {
                throw new Error(`Parent node has no children`)
            }

            if (parentNode.children.length - 1 > childIndex) {
                break;
            }

        }

        return this.getLeadingNodeVector(copiedPath);
    
    }
    
    private getLeadingNodeVector(path: number[]): DocumentVector {
        
        const localPath = [...path];
        localPath[localPath.length - 1] = localPath[localPath.length - 1] + 1;
    
        let node = this.getNodeByPath(localPath);
    
        while (documentNodeHasChildren(node) && node.children.length) {
            localPath.push(0); // Navigate to the first child
            node = node.children[0];
        }

        
    
        // Node should be a TextObject or an error needs to be thrown if no text node is reached
        if (documentNodeIsTextNode(node)) {
            return {
                path: localPath,
                index: 0 // Start at the beginning of the text node
            };
        } else {
            throw new Error("Node reached without text content");
        }
    }
    
    private getNodeByPath(path: number[]): ParagraphObject | FormatObject | TextObject {
        
        let node: ParagraphObject | FormatObject | TextObject  = this.paragraphs[path[0]];
    
        for (let i = 1; i < path.length; i++) {

            if (!documentNodeHasChildren(node)) {
                throw new Error(`Node on path before the end of path has no children.`)
            }

            node = node.children[path[i]];
        }
    
        return node;
    }
    


}

export default Document;
import Document from "../core/document-model";
import { TextObject, FormatObject, ParagraphObject, DocumentVector } from "../types";

class DomRenderer {

    private document: Document;
    private rootElement: HTMLElement;

    constructor(document: Document, rootElement: HTMLElement) {

        this.document = document;
        this.rootElement = rootElement;

    }

    // Writes the html from data to the rootElement
    public render():void {

        // Reset rootElement html:
        this.rootElement.innerHTML = '';

        this.document.paragraphs.forEach(paragraph => {
            const paragraphElement = this.generateParagraphElement(paragraph);
            this.rootElement.appendChild(paragraphElement);
        })

    }

    public partialRender(startVector: DocumentVector, endVector: DocumentVector): void {

        // Find array of common ancestor-node-indexes:
        const commonPath = this.commonVectorPath(startVector.path, endVector.path);

        // Resolve node from path:
        const lastCommonNode = this.resolvePathToNode(commonPath);

        this.regenerateNode(lastCommonNode, commonPath);

    }

    public textNodeRender(vector: DocumentVector): void {

        const textNodeObject = this.document.getTextNode(vector);
        const nodeElement = this.resolvePathToNode(vector.path);

        // Update innerText of nodeElement
        if (!(nodeElement instanceof Text)) {
            throw new Error(`Element resolved from vector path ${vector.path} is not an instance of Text`);
        }

        nodeElement.innerText = textNodeObject.content;

    }

    // Generates paragraph element
    private generateParagraphElement(paragraph: ParagraphObject): HTMLElement {

        // The html paragraph element
        const paragraphElement = document.createElement('p');

        paragraph.children.forEach(child => {

            let childElement: Node;

            if (child.type === 'text') {
                childElement = this.generateTextElement(child);
            } else {
                childElement = this.generateFormatElement(child);
            }

            paragraphElement.appendChild(childElement);

        })

        return paragraphElement;

    }

    // Generates format element recursively
    private generateFormatElement(format: FormatObject): HTMLElement {

        let formatElement: HTMLElement;

        switch(format.format) {
            case 'strong':
                formatElement = document.createElement('strong');
                break;
            case 'em':
                formatElement = document.createElement('em');
                break;
            case 'u':
                formatElement = document.createElement('u');
                break;
            default:
                throw new Error(`Unknown format: ${format.format}.`);
        }

        format.children.forEach(child => {

            let childElement: Node;

            if (child.type === 'text') {
                childElement = this.generateTextElement(child);
            } else {
                childElement = this.generateFormatElement(child);
            }

            formatElement.appendChild(childElement);

        });

        return formatElement;

    }

    private generateTextElement(text: TextObject): Text {
        return document.createTextNode(text.content);
    }

    private commonVectorPath(path1: number[], path2: number[]): number[] {

        const minLength: number = Math.min(path1.length, path2.length);

        const commonPath: number[] = [];

        for (let i = 0; i < minLength; i++) {

            if (path1[i] === path2[i]) {
                commonPath.push(path1[i]);
            } else {
                break;
            }

        }

        return commonPath;

    }

    private resolvePathToNode(path: number[]): HTMLElement {

        let node: HTMLElement = this.rootElement;

        for (const index of path) {

            if (node.children[index] == undefined) {
                throw new Error(`Unable to resolve path, index ${index} of an array of length ${node.children.length} was undefined.`);
            }

            if (!(node.children[index] instanceof HTMLElement)) {
                throw new TypeError(`Child ${node.children[index]} is not of type HTMLElement`);

            }

            node = node.children[index] as HTMLElement;
        }

        return node;

    }

    // Function needs a rewrite - poor quality...
    private regenerateNode(lastCommonNode: Node, nodePath: number[]): void {

        if (!nodePath.length) {
            this.render();
            return;
        }

        const paragraphIndex: number = nodePath.shift() as number;

        let endNode: FormatObject | TextObject | ParagraphObject = this.document.paragraphs[paragraphIndex];

        for (let i = 0; i < nodePath.length; i++) {

            endNode = endNode.children[nodePath[i]];

            if (endNode.type !== 'format') {
                return
            }

        }

        let htmlElement: Node;

        switch(endNode.type) {
            case 'paragraph':
                htmlElement = this.generateParagraphElement(endNode);
                break;
            case 'format':
                htmlElement = this.generateFormatElement(endNode);
                break;
            default:
                htmlElement = this.generateTextElement(endNode);
        }

        // TODO :: Change the lastCommonNode - element to htmlElement
        if (lastCommonNode.parentNode) {
            lastCommonNode.parentNode.replaceChild(htmlElement, lastCommonNode);
        } else {
            throw new Error (`Node must have a parent node to be replaceable`);
        }        

    }
}

export default DomRenderer;
import Document from "../models/document-model.js";
import DocumentOperator from "../operators/document-operator.js";
import { TextObject, FormatObject, ParagraphObject, DocumentVector, CarretPosition } from "../types.js";
import { documentNodeIsParagraphNode, documentNodeIsTextNode } from "../utils/guards.js";
import { resolvePathToNode } from "../utils/helpers/render.js";

class DomRenderer {

    private document: Document;
    private documentOperator: DocumentOperator;
    private rootElement: HTMLElement;

    constructor(document: Document, documentOperator: DocumentOperator, rootElement: HTMLElement) {

        this.document = document;
        this.documentOperator = documentOperator;
        this.rootElement = rootElement;

    }

    // Writes the html from data to the rootElement
    public render(): void {

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
        const lastCommonNode = resolvePathToNode(this.rootElement, commonPath);

        this.regenerateNode(lastCommonNode, commonPath);

    }

    public textNodeRender(vector: DocumentVector): void {

        const textNodeObject = this.documentOperator.getTextNode(vector);
        const nodeElement = resolvePathToNode(this.rootElement, vector.path);

        // Update innerText of nodeElement
        if (!(nodeElement instanceof Text)) {
            throw new Error(`Element resolved from vector path ${vector.path} is not an instance of Text`);
        }

        nodeElement.nodeValue = textNodeObject.content;

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

    public renderFromPath(path: number[]): void {

        // If the path is an empty array, rerender entire textbox:
        if (!path.length) {
            this.render();
            return;
        }

        // Assemble new node:
        const documentNode = this.documentOperator.getNodeByPath(path);
        let domNode: Node;

        if (documentNodeIsParagraphNode(documentNode)) {
            domNode = this.generateParagraphElement(documentNode);
        } else if (documentNodeIsTextNode(documentNode)) {
            domNode = this.generateTextElement(documentNode);
        } else {
            domNode = this.generateFormatElement(documentNode);
        }

        this.replaceNode(path, domNode);

    }

    private replaceNode(path: number[], newNode: Node) {
        if (path.length === 0) {
            throw new Error("Path cannot be empty.");
        }
    
        // Determine the parent node of the target node
        const parentPath = path.slice(0, -1);
        const parentNode = resolvePathToNode(this.rootElement, parentPath) as HTMLElement;
    
        if (!(parentNode instanceof HTMLElement)) {
            throw new TypeError("The parent node resolved is not an HTMLElement.");
        }
    
        const targetIndex = path[path.length - 1];
    
        if (parentNode.childNodes[targetIndex] === undefined) {
            throw new Error(`No child exists at the target index ${targetIndex}.`);
        }
    
        // Replace the old node with the new node
        parentNode.replaceChild(newNode, parentNode.childNodes[targetIndex]);
    }
    

    // Function needs a rewrite - poor quality...
    private regenerateNode(lastCommonNode: Node, nodePath: number[]): void {

        if (!nodePath.length) {
            this.render();
            return;
        }

        const paragraphIndex: number = nodePath[0];

        let endNode: FormatObject | TextObject | ParagraphObject = this.document.paragraphs[paragraphIndex];

        for (let i = 1; i < nodePath.length; i++) {

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
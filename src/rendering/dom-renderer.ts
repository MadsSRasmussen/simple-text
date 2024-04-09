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

    // TODO:
    public partialRender(startVector: DocumentVector, endVector: DocumentVector): void {
        console.log('partial rendering not yet implemented.');
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

    private generateTextElement(text: TextObject): Node {
        return document.createTextNode(text.content);
    }

}

export default DomRenderer;
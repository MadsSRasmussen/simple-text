import Document from "./document-model.js";
import DomRenderer from "../rendering/dom-renderer.js";
import { DocumentVector, ParagraphObject, TextObject, command } from "../types.js";
import { indexIsValid } from "../utils/guards.js";

// Class to handle inputs and manage the data and visual layer.
class Operator {

    private document: Document;
    private renderer: DomRenderer;

    constructor(document: Document, renderer: DomRenderer) {
        
        this.document = document;
        this.renderer = renderer;

    }

    public insertText(destination: DocumentVector, text: string): DocumentVector {

        const textNode: TextObject = this.document.getTextNode(destination);

        // Check that index is between 0 and textNode.content.length;
        if (!indexIsValid(destination.index, 0, textNode.content.length)) {
            throw new Error(`Invalid index in destination.index of ${destination.index}`);
        }

        // Insert string into textNode.content at destination.index:
        textNode.content = textNode.content.slice(0, destination.index) + text + textNode.content.slice(destination.index);

        // Re-render text-node
        this.renderer.textNodeRender(destination);

        // Return new destination vector, that has an index text.length more than previous:
        return { path: [...destination.path], index: destination.index + text.length }

    }

    public deleteChatacter(destination: DocumentVector): DocumentVector {

        const textNode: TextObject = this.document.getTextNode(destination);

        if (destination.index == 0) {

            // Cannot delete first paragraph
            if (destination.path[0] == 0) {
                return destination;
            }

            console.log('Removeing paragraph with index: ', destination.path[0]);

            // Concat paragraph children with current children
            const paragraph = this.document.paragraphs[destination.path[0]];
            
            const previousVector = this.document.getPreviousVector(destination);
            console.log(previousVector);

            // Delete paragraph
            this.document.paragraphs = [...this.document.paragraphs.splice(0, destination.path[0]), ...this.document.paragraphs.splice(destination.path[0])]


            // Concat two paragraphs
            this.document.paragraphs[destination.path[0] - 1].children = [...this.document.paragraphs[destination.path[0] - 1].children, ...paragraph.children];

            this.renderer.render();

            return previousVector;

        }

        // Check that index is between 0 and textNode.content.length;
        if (!indexIsValid(destination.index, 1, textNode.content.length)) {
            throw new Error(`Invalid index in destination.index of ${destination.index}`);
        }

        textNode.content = textNode.content.slice(0, destination.index - 1) + textNode.content.slice(destination.index)
        
        // Re-render text-node
        this.renderer.textNodeRender(destination);

        // Return new destination vector, that has an index text.length more than previous:
        return { path: [...destination.path], index: destination.index - 1 }

    }

    public insertParagraph(destination: DocumentVector): DocumentVector {

        const textNode: TextObject = this.document.getTextNode(destination);

        // Check that index is between 0 and textNode.content.length;
        if (!indexIsValid(destination.index, 0, textNode.content.length)) {
            throw new Error(`Invalid index in destination.index of ${destination.index}`);
        }

        const firstBit = textNode.content.substring(0, destination.index);
        const lastBit = textNode.content.substring(destination.index);

        // Set contents of original textNode to firstBit
        textNode.content = firstBit;

        const paragraph: ParagraphObject = {
            type: 'paragraph',
            children: [{
                type: 'text',
                content: lastBit
            }]
        }

        // Create new paragraph with textNode of lastBit, no style handeling for now...
        this.document.paragraphs = [...this.document.paragraphs.splice(0, destination.path[0] + 1), paragraph, ...this.document.paragraphs.splice(destination.path[0] + 1)];
        this.renderer.render();

        const copiedPath = [...destination.path];
        copiedPath[0] = copiedPath[0] + 1;

        return { path: copiedPath, index: 0 }


    }

    public exec(command: command): void {

        switch(command) {
            case 'bold':
                break;
            case 'itallic':
                break;
            case 'underline':
                break;
        }

    }

    private bold(startVector: DocumentVector, endVector?: DocumentVector): void {

        // Manipulate section:
        if (endVector) {

            return;
        }

        // Insert format around cursor:


    }

}

export default Operator;
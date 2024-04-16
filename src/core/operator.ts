import Document from "./document-model.js";
import DomRenderer from "../rendering/dom-renderer.js";
import { DocumentVector, TextObject, command } from "../types.js";
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
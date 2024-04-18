import TextboxState from "../core/textbox-state.js";
import Carret from "../rendering/carret-renderer.js";
import DomRenderer from "../rendering/dom-renderer.js";
import { DocumentVector } from "../types.js";
import DocumentOperator from "./document-operator.js";

import { selectionIsWithinElement } from "../utils/guards.js";
import { resolveNodeToPath } from "../utils/helpers/render.js";

class TextboxOperator {

    private state: TextboxState;
    private domRenderer: DomRenderer;
    private carret: Carret;
    private documentOperator: DocumentOperator;
    private textboxElement: HTMLElement;

    constructor(state: TextboxState, domRenderer: DomRenderer, carret: Carret, documentOperator: DocumentOperator, textboxElement: HTMLElement) {
        this.state = state;
        this.domRenderer = domRenderer;
        this.carret = carret;
        this.documentOperator = documentOperator;
        this.textboxElement = textboxElement;
    }

    public updateCarret(): void {
        this.carret.render(this.textboxElement, this.state.cursor);
    }

    public updateCarretFromSelection(selection: Selection): void {

        if (!selectionIsWithinElement(selection, this.textboxElement)) {
            return;
        }

        switch(selection.type) {
            case 'Caret':
                
                const range = selection.getRangeAt(0);
                
                // If startContainer is instance of Text, a complete vector can be found.
                if (range.startContainer instanceof Text) {

                    const rangeVector: DocumentVector = {
                        path: resolveNodeToPath(this.textboxElement, range.startContainer),
                        index: range.startOffset
                    }

                    this.state.cursor = rangeVector;
                    this.updateCarret();

                }

                break;
            case 'Range':
                break;
            default:
                console.log('Selection is neither carret or range!');
        }

    }

    public hideCarret(): void {
        this.carret.hide();
    }

    public moveCarretLeft(): void {
        this.state.cursor = this.documentOperator.getPreviousVector(this.state.cursor);
        this.updateCarret();
    }

    public moveCarretRight(): void {
        this.state.cursor = this.documentOperator.getNextVector(this.state.cursor);
        this.updateCarret();
    }

    // Inserts a string, also single characters, function is called on regular kydown events
    public insertText(text: string): void {
        this.state.cursor = this.documentOperator.insertText(text, this.state.cursor);
        this.domRenderer.textNodeRender(this.state.cursor);
        this.updateCarret();
    }

    // Inserts paragraph
    public insertParagraph(): void {
        this.state.cursor = this.documentOperator.insertParagraph(this.state.cursor);
        this.domRenderer.render();
        this.updateCarret();
    }

    // Deletes character or paragraph depending on state.cursor.index
    public backspace(): void {
        if (this.state.cursor.index == 0) {
            this.state.cursor = this.documentOperator.deleteParagraph(this.state.cursor);
            this.domRenderer.render();
        } else {
            this.state.cursor = this.documentOperator.deleteChatacter(this.state.cursor);
            this.domRenderer.textNodeRender(this.state.cursor);
        }
        this.updateCarret();
    }

}

export default TextboxOperator;
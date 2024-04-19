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

        if (!this.state.selectionRange) {
            this.carret.render(this.textboxElement, this.state.cursor);
        } else {
            this.carret.hide();
        }
        
    }

    public updateSelectionState(selection: Selection) {

        if (!selectionIsWithinElement(selection, this.textboxElement)) {
            return;
        }

        switch(selection.type) {
            case 'Caret':
                this.updateSelectionStateCaret(selection);
                break;
            case 'Range':
                this.updateSelectionStateRange(selection);
                break;
        }

    }

    private updateSelectionStateCaret(selection: Selection) {

        const anchorNode = selection.anchorNode;

        if (!anchorNode) {
            return;
        }

        if (anchorNode instanceof Text) {
            this.state.cursor = {
                path: resolveNodeToPath(this.textboxElement, anchorNode),
                index: selection.anchorOffset
            }
            this.state.selectionRange = null;
        }

    }

    private updateSelectionStateRange(selection: Selection) {

        const range = selection.getRangeAt(0);

        if ((range.startContainer instanceof Text) && (range.endContainer instanceof Text)) {
            const startVector: DocumentVector = { 
                path: resolveNodeToPath(this.textboxElement, range.startContainer),
                index: range.startOffset
            }
            const endVector: DocumentVector = {
                path: resolveNodeToPath(this.textboxElement, range.endContainer),
                index: range.endOffset
            }
            this.state.selectionRange = {
                start: startVector,
                end: endVector
            }
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
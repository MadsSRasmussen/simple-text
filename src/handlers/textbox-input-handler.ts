import TextboxOperator from "../operators/textbox-operator.js";
import { command } from "../types.js";
import { selectionIsWithinElement } from "../utils/guards.js";

class TextboxInputHandler {

    private textbox: HTMLElement;
    private textboxOperator: TextboxOperator;

    private commands: string[] = ['backspace', 'enter'];

    constructor(textbox: HTMLElement, textboxOperator: TextboxOperator) {

        this.textbox = textbox;
        this.textboxOperator = textboxOperator;
        
        // Allow passing by reference to event-listener - makes eventListener removeable
        this.handleSelectionChange = this.handleSelectionChange.bind(this);

        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        
        // Initialize eventlisteners
        this.textbox.addEventListener('keydown', (e) => { this.keydownHandler(e) });
        this.textbox.addEventListener('focusin', () => { this.textboxOperator.updateCarret() });
        this.textbox.addEventListener('blur', () => { this.textboxOperator.hideCarret() });

        // Ad selection-change handlers, only fire, when textBox is in focus:
        this.textbox.addEventListener('focus', () => { document.addEventListener('selectionchange', this.handleSelectionChange) })
        this.textbox.addEventListener('blur', () => { document.removeEventListener('selectionchange', this.handleSelectionChange) })

    }

    private handleSelectionChange(e: Event) {
        
        const selection = window.getSelection();

        // Validate selection;
        if (!selection) {
            return;
        }

        this.textboxOperator.updateCarretFromSelection(selection);


    };

    private keydownHandler(e: KeyboardEvent) {

        switch(e.key) {
            case 'ArrowLeft':
                this.textboxOperator.moveCarretLeft();
                return;
            case 'ArrowRight':
                this.textboxOperator.moveCarretRight();
                return;
            case 'Enter':
                this.textboxOperator.insertParagraph();
                return;
            case 'Backspace':
                this.textboxOperator.backspace();
                return;
        }

        if (e.key.length > 1) {
            return;
        }

        this.textboxOperator.insertText(e.key);

    }

}

export default TextboxInputHandler;
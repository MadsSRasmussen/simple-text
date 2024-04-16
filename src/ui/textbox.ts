import Document from "../core/document-model.js";
import Operator from "../core/operator.js";
import TextboxState from "../core/textbox-state.js";
import Carret from "../rendering/carret-renderer.js";
import DomRenderer from "../rendering/dom-renderer.js";

import type { command } from "../types.js";
import { indexIsValid } from "../utils/guards.js";

class Textbox {

    private container: HTMLElement;
    private textBoxElement: HTMLElement;

    private document: Document;
    private contentRenderer: DomRenderer;
    private carret: Carret;
    private operator: Operator;

    private state: TextboxState;

    private commands: string[] = ['Backspace', 'Enter', 'Shift']


    constructor(container: HTMLElement) {

        this.container = container;
        this.textBoxElement = generateTextboxElement();

        this.document = new Document();
        this.contentRenderer = new DomRenderer(this.document, this.textBoxElement);
        this.carret = new Carret(generateCarretElement(), container)

        this.operator = new Operator(this.document, this.contentRenderer);

        this.state = new TextboxState();

        this.init();

    }

    private init() {

        this.container.appendChild(this.textBoxElement);
        this.contentRenderer.render();

        this.textBoxElement.addEventListener('keydown', (e) => {
            
            if (e.key == 'ArrowLeft') {
                this.state.cursor = this.document.getPreviousVector(this.state.cursor);
                this.carret.render(this.textBoxElement, this.state.cursor);
            }

            if (e.key == 'ArrowRight') {
                this.state.cursor = this.document.getNextVector(this.state.cursor);
                this.carret.render(this.textBoxElement, this.state.cursor);
            }

            if (this.commands.includes(e.key)) {

                switch(e.key.toLowerCase()) {
                    case 'enter':
                        this.exec('insertParagraph');
                        break;
                    case 'backspace':
                        this.exec('deleteChatacter');
                        break;
                }

                return;
            }

            if (e.key.length > 1) {
                return;
            }

            this.state.cursor = this.operator.insertText(this.state.cursor, e.key); 
            this.carret.render(this.textBoxElement, this.state.cursor);

        })

        this.textBoxElement.addEventListener('focusin', () => {
            this.carret.render(this.textBoxElement, this.state.cursor);
        })

        this.textBoxElement.addEventListener('focusout', () => {
            this.carret.hide();
        });

    }

    public exec(command: command) {

        switch(command) {
            case 'insertParagraph':
                this.state.cursor = this.operator.insertParagraph(this.state.cursor);
                this.carret.render(this.textBoxElement, this.state.cursor);
                break;
            case 'deleteChatacter':
                this.state.cursor = this.operator.deleteChatacter(this.state.cursor);
                this.carret.render(this.textBoxElement, this.state.cursor);
                break;
            case 'bold':
                break;
            case 'itallic':
                break;
            case 'underline':
                break;
        }

    }


}

export default Textbox;

function generateTextboxElement(): HTMLElement {

    const container = document.createElement('div');
    container.classList.add('textBox');
    container.setAttribute('tabindex', '0')

    container.addEventListener('click', function() {
        this.focus();
    });

    return container;

}

function generateCarretElement(): HTMLElement {

    const carret = document.createElement('span');
    carret.classList.add('carret');
    return carret;

}
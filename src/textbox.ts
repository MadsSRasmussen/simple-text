import Document from "./models/document-model.js";
import DocumentOperator from "./operators/document-operator.js";
import TextboxState from "./core/textbox-state.js";
import TextboxInputHandler from "./handlers/textbox-input-handler.js";
import TextboxOperator from "./operators/textbox-operator.js";
import Carret from "./rendering/carret-renderer.js";
import DomRenderer from "./rendering/dom-renderer.js";
import { DocumentVector, FormatFlags } from "./types.js";

class Textbox {

    public textbox: HTMLElement;

    private document: Document;
    public carret: Carret;
    private state: TextboxState;

    private inputHandler: TextboxInputHandler;
    private documentOperator: DocumentOperator;
    private operator: TextboxOperator;
    private renderer: DomRenderer;

    constructor(textbox: HTMLElement, onFormatChange: (formats: FormatFlags) => void) {

        this.document = new Document();
        this.carret = new Carret();
        this.state = new TextboxState(onFormatChange);

        this.textbox = textbox;
        this.documentOperator = new DocumentOperator(this.document, this.state)
        this.renderer = new DomRenderer(this.document, this.documentOperator, this.textbox)
        this.operator = new TextboxOperator(this.state, this.renderer, this.carret, this.documentOperator, this.textbox);
        this.inputHandler = new TextboxInputHandler(this.textbox, this.operator);

        this.init();
    
    }

    private init() {

        this.renderer.render();

    }

    public getData(): string {
        return this.document.toString();
    }

    public getCursorVector(): DocumentVector {
        return this.state.cursor;
    }

}

export default Textbox;
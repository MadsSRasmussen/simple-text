import Document from "./core/document-model.js";
import DomRenderer from "./rendering/dom-renderer.js";
import Operator from "./core/operator.js";

import { DocumentVector } from "./types";

const someDiv = document.getElementById('someDiv') as HTMLElement;



const aDocument = new Document();
const renderer = new DomRenderer(aDocument, someDiv);
const operator = new Operator(aDocument, renderer);

renderer.render();

let vector: DocumentVector = {
    path: [0, 0],
    index: 0
}

const input = document.getElementById('testInput') as HTMLInputElement;
input.addEventListener('input', (e: Event) => {
    
    if (!e.data) {
        return;
    }

    vector = operator.insertText(vector, e.data);

})

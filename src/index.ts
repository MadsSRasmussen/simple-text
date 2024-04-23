import Textbox from './textbox.js';
import { FormatFlags } from './types.js';
import { generateTextboxElement } from './utils/html-generators.js';



/*
document.addEventListener('selectstart', () => {
    console.log('Selection start!');
})
document.addEventListener('select', () => {
    console.log('Select!');
})
*/

const formatDiv = document.getElementById('formats') as HTMLElement;

const onFormatChange = (formats: FormatFlags) => {
    formatDiv.innerHTML = JSON.stringify(formats);
}

const textBox = generateTextboxElement();
document.querySelector('body')?.appendChild(textBox);
const textBoxClass = new Textbox(textBox, onFormatChange);

const logJsonButton = document.getElementById('logJson');
logJsonButton?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(JSON.parse(textBoxClass.getData()));
})

const logCursorButton = document.getElementById('logCursor');
logCursorButton?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(textBoxClass.getCursorVector())
})

/*
document.addEventListener('selectionchange', () => {

    console.log(textBoxClass.carret);

    const anchorNode = window.getSelection()?.anchorNode;
    const parentNode = anchorNode?.parentNode;

    if (!parentNode) {
        return;
    }

    console.log(window.getSelection());

    function getIndexInParentChildArray(parent: ParentNode, child: Node): number {

        const childNodesArray = Array.from(parent.childNodes);
        const indexOfChild = childNodesArray.findIndex(node => node === child);

        if (indexOfChild !== -1) {
            return indexOfChild
        }

        throw new Error('Child not found in parent childNodes array.');

    }

})
*/

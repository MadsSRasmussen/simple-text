import Textbox from './textbox.js';
import { generateTextboxElement } from './utils/html-generators.js';



/*
document.addEventListener('selectstart', () => {
    console.log('Selection start!');
})
document.addEventListener('select', () => {
    console.log('Select!');
})
*/

const textBox = generateTextboxElement();
document.querySelector('body')?.appendChild(textBox);
const textBoxClass = new Textbox(textBox);

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

import { DocumentVector, CarretPosition } from "../types.js";
import { resolvePathToNode } from "../utils/helpers/render.js";
import { generateCarretElement } from "../utils/html-generators.js";

class Carret {

    private carretElement: HTMLElement;
    private rootElement: HTMLElement;

    constructor () {

        const bodyElement = document.querySelector('body');

        if (!bodyElement) {
            throw new Error('No body element found, cannot instantiate carret.');
        }

        this.carretElement = generateCarretElement();
        this.rootElement = bodyElement;
        this.rootElement.appendChild(this.carretElement);
        this.hide();

    }

    public render(rootElement: HTMLElement, vector: DocumentVector): void {

        const textNode = resolvePathToNode(rootElement, vector.path);
        const position = this.getCarretPosition(textNode, vector);

        this.carretElement.style.left = `${position.x}px`;
        this.carretElement.style.top = `${position.y}px`;

        this.carretElement.style.display = 'block';

    }

    public hide(): void {
        
        this.carretElement.style.display = 'none';
    
    }

    private getCarretPosition(textNode: Node, vector: DocumentVector): CarretPosition {

        // If you click on an emptynparagraph...
        if (!textNode.textContent && textNode.parentElement) {
            const parentRect = textNode.parentElement?.getBoundingClientRect();
            return { x: parentRect.right, y: parentRect.top };
        }

        const range = document.createRange();
        range.setStart(textNode, vector.index);
        range.setEnd(textNode, vector.index);
        const rect = range.getBoundingClientRect();

        return { x: rect.left, y: rect.top }

    }

}

export default Carret;
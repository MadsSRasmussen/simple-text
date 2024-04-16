import { createIncrementalProgram } from "../../node_modules/typescript/lib/typescript";
import { DocumentVector, CarretPosition } from "../types";
import { resolvePathToNode } from "../utils/helpers/render.js";

class Carret {

    private carret: HTMLElement;

    constructor(carret: HTMLElement, rootElement: HTMLElement) {

        this.carret = carret;
        rootElement.appendChild(this.carret);

    }

    public render(rootElement: HTMLElement, vector: DocumentVector): void {

        const textNode = resolvePathToNode(rootElement, vector.path);
        const position = this.getCarretPosition(textNode, vector);

        this.carret.style.left = `${position.x}px`;
        this.carret.style.top = `${position.y}px`;

        this.carret.style.display = 'block';

    }

    public hide(): void {
        
        this.carret.style.display = 'none';
    
    }

    private getCarretPosition(textNode: Node, vector: DocumentVector): CarretPosition {

        const range = document.createRange();
        range.setStart(textNode, vector.index);
        range.setEnd(textNode, vector.index);
        const rect = range.getBoundingClientRect();

        return { x: rect.left, y: rect.top }

    }

}

export default Carret;
export function resolvePathToNode(rootElement: HTMLElement, path: number[]): Node {

    let node: Node = rootElement;


    for (const index of path) {

        if (node.childNodes[index] == undefined) {
            throw new Error(`Unable to resolve path, index ${index} of an array of length ${node.childNodes.length} was undefined.`);
        }

        if (!(node.childNodes[index] instanceof Node)) {
            throw new TypeError(`Child ${node.childNodes[index]} is not of type HTMLElement`);

        }

        node = node.childNodes[index];
    
    }

    return node;

}

export function resolveNodeToPath(containerElement: HTMLElement, node: Node): number[] {


    if (!containerElement.contains(node)) {
        throw new Error ('Node is not contained in containerElement');
    }

    const path: number[] = [];

    if (!node.parentNode) {
        return path;
    }

    do {
        path.push(getIndexInParentChildArray(node.parentNode, node));
        node = node.parentNode;
    } while (node.parentNode && node !== containerElement);

    return path.reverse();

}

export function getIndexInParentChildArray(parent: ParentNode, child: Node): number {

    const childNodesArray = Array.from(parent.childNodes);
    const indexOfChild = childNodesArray.findIndex(node => node === child);

    if (indexOfChild !== -1) {
        return indexOfChild
    }

    throw new Error('Child not found in parent childNodes array.');

}    
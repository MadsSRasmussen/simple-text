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
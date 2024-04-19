import { DocumentVector, SelectionRange } from "../types";

class TextboxState {

    public cursor: DocumentVector;
    public selectionRange: SelectionRange | null;

    constructor() {
        this.cursor = {
            path: [0, 0],
            index: 0
        }
        this.selectionRange = null;
    }

}

export default TextboxState;
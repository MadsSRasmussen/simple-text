import { DocumentVector } from "../types";

class TextboxState {

    private _cursor: DocumentVector;

    constructor() {
        this._cursor = {
            path: [0, 0],
            index: 0
        }
    }

    get cursor(): DocumentVector {
        return this._cursor;
    }

    set cursor(vector: DocumentVector) {
        this._cursor = vector;
    }

}

export default TextboxState;
import { DocumentVector, FormatFlags, SelectionRange, format } from "../types";

class TextboxState {

    public cursor: DocumentVector;
    public selectionRange: SelectionRange | null;
    private _selectionFormats: FormatFlags;
    private formats: format[];
    private onFormatChange: (formats: FormatFlags) => void;

    constructor(onFormatChange: (formats: FormatFlags) => void) {
        this.cursor = {
            path: [0, 0],
            index: 0
        }
        this.selectionRange = null;
        this._selectionFormats = {
            strong: false,
            em: false,
            u: false,
            title: false,
        }
        this.formats = Object.keys(this._selectionFormats) as format[];
        this.onFormatChange = onFormatChange;
        this.onFormatChange(this._selectionFormats);
    }

    set selectionFormats(value: FormatFlags) {

        for (let i = 0; i < this.formats.length; i++) {

            if (value[this.formats[i]] !== this._selectionFormats[this.formats[i]]) {
                this._selectionFormats = value;
                this.onFormatChange(this._selectionFormats);
                return;
            }

        }

    }

    get selectionFormats(): FormatFlags {
        return this._selectionFormats;
    }

    public getSelectionFormatsArray(): format[] {
        return (Object.keys(this._selectionFormats) as format[]).filter(format => this._selectionFormats[format] == true);
    }

}

export default TextboxState;
import Document from "../models/document-model.js";
import { documentNodeIsTextNode, documentNodeIsFormatNode, documentNodeHasChildren, indexIsValid, documentNodeIsLastTextNodeOfParagraph, documentNodeIsFirstTextNodeOfParagraph, documentNodeIsParagraphNode } from "../utils/guards.js";
import { DocumentVector, ParagraphObject, FormatObject, TextObject } from "../types.js";
import type { FormatFlags, SelectionRange, format } from "../types.js";
import { generateFormatObject, generateTextObject, generateFormatFlagsObject, getIndexOfChildInParentChildrenArray, documentVectorsAreDeeplyEqual, arraysAreDeeplyEqual, generateNestedTextObject, getSubNodeInNode, getFomrtasArrayOfNodeInSubNode } from "../utils/helpers/document.js";
import TextboxState from "../core/textbox-state.js";

// Class to handle document related operations in the data-layer
class DocumentOperator {

    private document: Document;
    private state: TextboxState;

    constructor(document: Document, state: TextboxState) {
        this.document = document;
        this.state = state;
    }

    public getTextNode(vector: DocumentVector): TextObject {

        const copiedVector: DocumentVector = { ...vector };

        const paragraphIndex = copiedVector.path[0]

        // If the result of copiedVector.path.shift() is undefined, the array must have a length 0;
        if (paragraphIndex === undefined) {
            throw new Error(`The result of vector.path.shift() was undefined vector.path has a length of ${copiedVector.path.length}`);
        }

        const paragraph: ParagraphObject = this.document.paragraphs[paragraphIndex]

        let node: ParagraphObject | FormatObject | TextObject = paragraph;

        for (let i = 1; i < copiedVector.path.length; i++) {

            const index = copiedVector.path[i];

            if (documentNodeHasChildren(node)) {

                node = node.children[index]
                continue;

            } else {

                if (i !== copiedVector.path.length) {
                    throw new Error(`Node without children encountered before end of vector.path`);
                }

            }

        }

        if (documentNodeIsTextNode(node)) {
            return node;
        } else {
            throw new Error(`Resulting node was of type ${node.type}`);
        }

    }

    public insertText(text: string, destination: DocumentVector): DocumentVector {

        const textNode: TextObject = this.getTextNode(destination);

        // Check that index is between 0 and textNode.content.length;
        if (!indexIsValid(destination.index, 0, textNode.content.length)) {
            throw new Error(`Invalid index in destination.index of ${destination.index}`);
        }

        // Insert string into textNode.content at destination.index:
        textNode.content = textNode.content.slice(0, destination.index) + text + textNode.content.slice(destination.index);

        // Return new destination vector, that has an index text.length more than previous:
        return { path: [...destination.path], index: destination.index + text.length }

    }

    public getPreviousVector(vector: DocumentVector): DocumentVector {

        const textNode = this.getTextNode(vector);

        if (documentNodeIsFirstTextNodeOfParagraph(vector)) {

            // Check if index - 1 is out of range of the initial textNode
            if (indexIsValid(vector.index - 1, 0, textNode.content.length)) {
                const returnVector = { path: [...vector.path], index: vector.index - 1};
                return returnVector;
            }

        } else { // Document node must be of type Format, we will not allow index-position 0

            // Check if index - 1 is out of range of the initial textNode
            if (indexIsValid(vector.index - 1, 1, textNode.content.length)) {
                const returnVector = { path: [...vector.path], index: vector.index - 1};
                return returnVector;
            }

        }

        // If vector is equal to the first leading vector in the entire document, return
        if (documentVectorsAreDeeplyEqual(this.firstLeading([0]), vector)) {
            return vector;
        }

        // Recursive function: 1 generation up - check if path is > 0, if it is, continue along this path with max-index, values, until text-node is reached.
        const copiedPath = [...vector.path];

        const findImmediateTrailingVector = (path: number[]): DocumentVector => {

            if (path[path.length - 1] > 0) {
                const localPath = [...path];
                // Set last element of copied path to one less, and get endNode from this
                localPath[localPath.length - 1] = localPath[localPath.length - 1] - 1;
                return this.getTrailingNodeVector(localPath);
            } else {

                if (path.length == 1) {
                    throw new Error(`Unable to find previous vector`);
                }
                path.pop();
                return findImmediateTrailingVector(path)
            }

        }

        const returnVector = findImmediateTrailingVector(copiedPath);
        return returnVector;

    }

    public getTrailingNodeVector(path: number[]): DocumentVector {

        const localPath = [...path];

        let node: ParagraphObject | FormatObject | TextObject = this.document.paragraphs[localPath[0]];

        for (let i = 1; i < localPath.length; i++) {
            if (documentNodeHasChildren(node)) {

                node = node.children[localPath[i]]
                continue;

            } else {
                if (i !== localPath.length - 1) {
                    throw new Error(`Node without children encountered before end of vector.path`);
                }
            }
        }

        const nodeVector: DocumentVector = findLastTrailing(node);

        return nodeVector;

        function findLastTrailing(node: ParagraphObject | FormatObject | TextObject): DocumentVector {

            if (documentNodeIsTextNode(node)) {
                return {
                    path: localPath,
                    index: node.content.length
                }
            }

            if (!documentNodeHasChildren(node)) {
                throw new Error(`Node was not of type TextNode and had no children`)
            }

            return findLastTrailing(getNextTrailing(node));

        }

        function getNextTrailing(node: ParagraphObject | FormatObject): ParagraphObject | FormatObject | TextObject {
            localPath.push(node.children.length - 1);
            return node.children[node.children.length - 1];
        }

    }

    public getNextVector(vector: DocumentVector): DocumentVector {
        
        const textNode = this.getTextNode(vector);
    
        // Check if index + 1 is within the range of the current textNode's content
        if (indexIsValid(vector.index + 1, 0, textNode.content.length)) {
            const returnVector = { path: [...vector.path], index: vector.index + 1};
            return returnVector;
        }

        // If vector is equal to the first leading vector in the entire document, return
        if (documentVectorsAreDeeplyEqual(this.lastTrailing([this.document.paragraphs.length - 1]), vector)) {
            return vector;
        }
    
        const copiedPath = [...vector.path];
    
        for (let i = copiedPath.length - 1; i > 0; i--) {

            const childIndex = copiedPath[copiedPath.length - 1];

            if (childIndex === undefined) {
                throw new Error(`path.pop() resulted in undefined`)
            }

            const parentNode = this.getNodeByPath(copiedPath.slice(0, -1));

            if (!documentNodeHasChildren(parentNode)) {
                throw new Error(`Parent node has no children`)
            }

            if (parentNode.children.length - 1 > childIndex) {
                break;
            }
            
            copiedPath.pop();

        }

        const returnVector = this.getLeadingNodeVector(copiedPath);

        // If the original documentVector was not the last-vector of the paragraph, we set index to 1, to prevent same cursor-position.
        if (!documentNodeIsLastTextNodeOfParagraph(vector, this.document.paragraphs[vector.path[0]])) {
            returnVector.index++;
        }

        return returnVector;
    
    }
    
    private getLeadingNodeVector(path: number[]): DocumentVector {
        
        const localPath = [...path];
        localPath[localPath.length - 1] = localPath[localPath.length - 1] + 1;
    
        let node = this.getNodeByPath(localPath);
    
        while (documentNodeHasChildren(node) && node.children.length) {
            localPath.push(0); // Navigate to the first child
            node = node.children[0];
        }
    
        // Node should be a TextObject or an error needs to be thrown if no text node is reached
        if (documentNodeIsTextNode(node)) {
            return {
                path: localPath,
                index: 0 // Start at the beginning of the text node
            };
        } else {
            throw new Error("Node reached without text content");
        }
    }
    
    public getNodeByPath(path: number[]): ParagraphObject | FormatObject | TextObject {


        let node: ParagraphObject | FormatObject | TextObject  = this.document.paragraphs[path[0]];
        
        for (let i = 1; i < path.length; i++) {

            if (!documentNodeHasChildren(node)) {
                throw new Error(`Node on path before the end of path has no children.`)
            }

            node = node.children[path[i]];
  
        }
    
        return node;
    }

    public deleteSingle(destination: DocumentVector): { newVector: DocumentVector, latestChangedPath: number[] } {

        // If index i 0, delete paragraph...
        if (destination.index == 0) {
            const returnVector = this.deleteParagraph(destination);
            return {
                newVector: returnVector,
                latestChangedPath: []
            };
        }

        const textNode: TextObject = this.getTextNode(destination);

        // Check that index is between 0 and textNode.content.length;
        if (!indexIsValid(destination.index, 1, textNode.content.length)) {
            throw new Error(`Invalid index in destination.index of ${destination.index}`);
        }

        textNode.content = textNode.content.slice(0, destination.index - 1) + textNode.content.slice(destination.index)
        
        const previousVector = this.getPreviousVector(destination);
        let latestChangedPath = [...destination.path];

        if (textNode.content.length === 0 && !documentNodeIsFirstTextNodeOfParagraph(destination)) {
            
            const parentNode = this.getNodeByPath(destination.path.slice(0, -1));
            if (!documentNodeHasChildren(parentNode)) {
                throw new Error('Parent node had no children.');
            }

            // Only if the text-node is the only child of the paragraph node, should the paragraph node be deleted...
            if (parentNode.children.length == 1) {
                this.deleteNode(destination.path.slice(0, -1));
                latestChangedPath = latestChangedPath.slice(0, -2);
            } else {
                latestChangedPath = destination.path;
            }

        }

        return {
            newVector: previousVector,
            latestChangedPath: latestChangedPath
        }        

    }

    private deleteNode(path: number[]) {

        const parentNode = this.getNodeByPath(path.slice(0, -1));

        if (!documentNodeHasChildren(parentNode)) {
            throw new Error('Parent node had no children error');
        }

        parentNode.children.splice(path[path.length - 1], 1);

    }

    public insertParagraph(desintaion: DocumentVector): DocumentVector {

        const indexOfParagraph = desintaion.path[0]

        // Split paragraphNode:
        const { firstSplit, lastSplit } = this.splitNodeAlongVector(desintaion, [indexOfParagraph]);

        if (!(documentNodeIsParagraphNode(firstSplit) && documentNodeIsParagraphNode(lastSplit))) {
            throw new Error('Splits of insertParagraph were not both of type ParagraphObject');
        }

        this.document.paragraphs.splice(indexOfParagraph, 1, firstSplit, lastSplit);

        return this.firstLeading([indexOfParagraph + 1]);

    }
    
    public insertFormat(destination: DocumentVector, format: format): DocumentVector {

        const textNode: TextObject = this.getTextNode(destination);
        const parentNode = this.getNodeByPath(destination.path.slice(0, -1));

        if (!documentNodeHasChildren(parentNode)) {
            throw new Error(`Parent node of destination node had no children...`);
        }
        if (!indexIsValid(destination.index, 0, textNode.content.length)) {
            throw new Error(`Invalid index in destination.index of ${destination.index}`);
        }

        const indexOfChildInParentArray = getIndexOfChildInParentChildrenArray(parentNode, textNode);
        const formatObject = generateFormatObject(format);

        let returnVector: DocumentVector;

        // Different textNode scenarios:
        if (textNode.content.length == 0) {
            replace(parentNode, textNode, indexOfChildInParentArray);
            returnVector = { path: [...destination.path, 0], index: 0 }
        } else if (destination.index == 0) {
            insertBefore(parentNode, textNode, indexOfChildInParentArray);
            returnVector = { path: [...destination.path.slice(0, -1), indexOfChildInParentArray, 0], index: 0 }
        } else  if (destination.index == textNode.content.length) {
            insertAfter(parentNode, textNode, indexOfChildInParentArray);
            returnVector = { path: [...destination.path.slice(0, -1), indexOfChildInParentArray + 1, 0], index: 0 }
        } else {
            insertInto(parentNode, textNode, indexOfChildInParentArray);
            returnVector = { path: [...destination.path.slice(0, -1), indexOfChildInParentArray + 1, 0], index: 0 }
        }

        return returnVector;

        function insertBefore(parentNode: ParagraphObject | FormatObject, nodeToInsert: TextObject, indexOfChild: number): void {
            parentNode.children.splice(indexOfChild, 0, formatObject);
        }

        function insertInto(parentNode: ParagraphObject | FormatObject, nodeToInsert: TextObject, indexOfChild: number): void {

            // Split textNode
            const firstBit = nodeToInsert.content.substring(0, destination.index);
            const lastBit = nodeToInsert.content.substring(destination.index);

            const firstBitTextNode = generateTextObject(firstBit);
            const lastBitTextNode = generateTextObject(lastBit);

            // Insert both textnodes and formatNode...
            parentNode.children.splice(indexOfChild, 1, firstBitTextNode, formatObject, lastBitTextNode);

        }

        function insertAfter(parentNode: ParagraphObject | FormatObject, nodeToInsert: TextObject, indexOfChild: number): void {
            parentNode.children.splice(indexOfChild + 1, 0, formatObject);
        }

        function replace(parentNode: ParagraphObject | FormatObject, nodeToInsert: TextObject, indexOfChild: number): void {
            parentNode.children[indexOfChild] = formatObject;
        }

    }

    // TODO -> Implement formatting of multipleParagraphs:
    public insertFormatSelection(range: SelectionRange, format: format): { range: SelectionRange, cursorPosition: DocumentVector } {

        const longestIdenticalPath = this.getLongestIdenticalPath(range.start, range.end);

        // Selection is within a single paragraph:
        if (longestIdenticalPath.length > 0) {

            const rootNode = this.getNodeByPath(longestIdenticalPath);

            // Assemble split sections of rootNode:
            const firstBit = this.assembleBranchFromFirstLeadingToVector(longestIdenticalPath, range.start);
            const lastBit = this.assembleBranchFromVectorToLastTrailing(longestIdenticalPath, range.end);

            // Purge middleBit for format
            const middleBit = this.purgeFormat(this.assembleBranchFromVectorToVector(longestIdenticalPath ,range.start, range.end), format);

            // Root node is paragraphNode, update this.document.paragraphs array
            if (documentNodeIsParagraphNode(rootNode)) {

                if (!(documentNodeIsParagraphNode(firstBit) && documentNodeIsParagraphNode(middleBit) && documentNodeIsParagraphNode(lastBit))) {
                    throw new Error('Node splits were not of the same type as rootNode');
                }

                // Create a formatNode from the children of middleBitParagraph
                const formatNode: FormatObject = {
                    type: 'format',
                    format: format,
                    children: [...middleBit.children]
                }

                const indexOfRootNodeInrootNodeParent = longestIdenticalPath[0];
                this.document.paragraphs.splice(indexOfRootNodeInrootNodeParent, 1, firstBit, middleBit, lastBit);

                const pathToFirstSplit = [indexOfRootNodeInrootNodeParent];
                const pathToLastSplit = [indexOfRootNodeInrootNodeParent + 2];

                const { purgedNode: firstSplitPurgedNode, removedOrigin: firstSplitRemovedOrigin } = this.purgeNodeForEmptyTextNodes(pathToFirstSplit);
                const { purgedNode: lastSplitPurgedNode, removedOrigin: lastSplitRemovedOrigin } = this.purgeNodeForEmptyTextNodes(pathToLastSplit);

                // Remove firstBit, middleBit, lastBit
                this.document.paragraphs.splice(indexOfRootNodeInrootNodeParent, 3);

                // Both nodes exist
                if (firstSplitPurgedNode && lastSplitPurgedNode) {

                    if (!(documentNodeIsParagraphNode(firstSplitPurgedNode) || documentNodeIsParagraphNode(lastSplitPurgedNode))) {
                        throw new Error('Purged nodes expected as paragraphObjects');
                    }

                    const paragraphNode: ParagraphObject = {
                        type: 'paragraph',
                        children: [...firstBit.children, formatNode, ...lastBit.children]
                    }

                    // Insert paragraphNode
                    this.document.paragraphs.splice(indexOfRootNodeInrootNodeParent, 0, paragraphNode);

                    const pathToFormatNode = [indexOfRootNodeInrootNodeParent, 1];
                    const resultingRange: SelectionRange = { start: this.firstLeading(pathToFormatNode), end: this.lastTrailing(pathToFormatNode) };
                    return { range: resultingRange, cursorPosition: this.lastTrailing(pathToFormatNode) };

                }

                // Only firstSplit exists
                if (firstSplitPurgedNode) {

                    if (!documentNodeIsParagraphNode(firstSplitPurgedNode)) {
                        throw new Error('Expected a paragraphObject');
                    }

                    const paragraphNode: ParagraphObject = {
                        type: 'paragraph',
                        children: [...firstBit.children, formatNode]
                    };
                    
                    // Insert paragraphNode
                    this.document.paragraphs.splice(indexOfRootNodeInrootNodeParent, 0, paragraphNode);

                    const pathToFormatNode = [indexOfRootNodeInrootNodeParent, 1];
                    const resultingRange: SelectionRange = { start: this.firstLeading(pathToFormatNode), end: this.lastTrailing(pathToFormatNode) };
                    return { range: resultingRange, cursorPosition: this.lastTrailing(pathToFormatNode) };
                }

                // Only lastSplit exists
                if (lastSplitPurgedNode) {

                    if (!documentNodeIsParagraphNode(lastSplitPurgedNode)) {
                        throw new Error('Expected a paragraphObject');
                    }

                    const paragraphNode: ParagraphObject = {
                        type: 'paragraph',
                        children: [formatNode, ...lastSplitPurgedNode.children]
                    }

                    this.document.paragraphs.splice(indexOfRootNodeInrootNodeParent, 0 , paragraphNode);

                    const pathToFormatNode = [indexOfRootNodeInrootNodeParent, 0];
                    const resultingRange: SelectionRange = { start: this.firstLeading(pathToFormatNode), end: this.lastTrailing(pathToFormatNode) };
                    return { range: resultingRange, cursorPosition: this.lastTrailing(pathToFormatNode) };

                }

                // Neither split exists
                if (!(firstSplitPurgedNode || lastSplitPurgedNode)) {

                    const paragraphNode: ParagraphObject = {
                        type: 'paragraph',
                        children: [formatNode]
                    }

                    this.document.paragraphs.splice(indexOfRootNodeInrootNodeParent, 0 , paragraphNode);

                    const pathToFormatNode = [indexOfRootNodeInrootNodeParent, 0];
                    const resultingRange: SelectionRange = { start: this.firstLeading(pathToFormatNode), end: this.lastTrailing(pathToFormatNode) };
                    return { range: resultingRange, cursorPosition: this.lastTrailing(pathToFormatNode) };

                }

                throw new Error('Scenario not yet implemented.');
            }

            if (documentNodeIsParagraphNode(firstBit) || documentNodeIsParagraphNode(middleBit) || documentNodeIsParagraphNode(lastBit)) {
                throw new Error('One ot the splits of a rootNode, that was not of type ParagraphObject was a ParagraphObject');
            }

            const formatNode: FormatObject = {
                type: 'format',
                format: format,
                children: [middleBit]
            }

            const rootNodeParentNode = this.getNodeByPath(longestIdenticalPath.slice(0, -1));
            
            if (documentNodeIsTextNode(rootNodeParentNode)) {
                throw new Error('Parent note returned as textNode');
            }

            const indexOfrootNodeInRootNodeParent = getIndexOfChildInParentChildrenArray(rootNodeParentNode, rootNode);
            rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent, 1, firstBit, formatNode, lastBit);
            
            const pathToFirstSplit = longestIdenticalPath;
            const pathToLastSplit = [...longestIdenticalPath.slice(0, -1), longestIdenticalPath[longestIdenticalPath.length - 1] + 2];

            const { purgedNode: firstSplitPurgedNode, removedOrigin: firstSplitRemovedOrigin } = this.purgeNodeForEmptyTextNodes(pathToFirstSplit);
            const { purgedNode: lastSplitPurgedNode, removedOrigin: lastSplitRemovedOrigin } = this.purgeNodeForEmptyTextNodes(pathToLastSplit);

            // Both nodes exist:
            if (firstSplitPurgedNode && lastSplitPurgedNode) {

                if (documentNodeIsParagraphNode(firstSplitPurgedNode) || documentNodeIsParagraphNode(lastSplitPurgedNode)) {
                    throw new Error('Purged nodes returned as ParagraphObjects');
                }

                // Replace firstSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent, 1, firstSplitPurgedNode);

                // Replace lastSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent + 2, 1, lastSplitPurgedNode);

                const pathToMiddleSplit = [...longestIdenticalPath.slice(0, -1), longestIdenticalPath[longestIdenticalPath.length - 1] + 1];

                const resultingRange: SelectionRange = { start: this.firstLeading(pathToMiddleSplit), end: this.lastTrailing(pathToMiddleSplit) };
                return { range: resultingRange, cursorPosition: this.lastTrailing(pathToMiddleSplit) };

            }

            // Only firstSplit exists
            if (firstSplitPurgedNode) {

                if (documentNodeIsParagraphNode(firstSplitPurgedNode)) {
                    throw new Error('Purged node returned as ParagraphObject');
                }

                // Replace firstSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent, 1, firstSplitPurgedNode);

                // Remove lastSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent + 2, 1);

                const pathToMiddleSplit = [...longestIdenticalPath.slice(0, -1), longestIdenticalPath[longestIdenticalPath.length - 1] + 1];

                const resultingRange: SelectionRange = { start: this.firstLeading(pathToMiddleSplit), end: this.lastTrailing(pathToMiddleSplit) };
                return { range: resultingRange, cursorPosition: this.lastTrailing(pathToMiddleSplit) };

            }

            // Only lastSplit exists
            if (lastSplitPurgedNode) {

                if (documentNodeIsParagraphNode(lastSplitPurgedNode)) {
                    throw new Error('Purged node returned as ParagraphObject');
                }

                // Replace lastSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent + 2, 1, lastSplitPurgedNode);
                
                // Remove firstSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent, 1);

                const pathToMiddleSplit = longestIdenticalPath;
                const resultingRange: SelectionRange = { start: this.firstLeading(pathToMiddleSplit), end: this.lastTrailing(pathToMiddleSplit) };
                return { range: resultingRange, cursorPosition: this.lastTrailing(pathToMiddleSplit) };

            }

            // Neither first nor lastNode exists
            if(!(firstSplitPurgedNode || lastSplitPurgedNode)) {

                // Remove lastSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent + 2, 1);

                // Remove firstSplit
                rootNodeParentNode.children.splice(indexOfrootNodeInRootNodeParent, 1);

                const pathToMiddleSplit = longestIdenticalPath;
                const resultingRange: SelectionRange = { start: this.firstLeading(pathToMiddleSplit), end: this.lastTrailing(pathToMiddleSplit) };
                return { range: resultingRange, cursorPosition: this.lastTrailing(pathToMiddleSplit) };

            }

            throw new Error('Unsupported scenario...');

        }

        throw new Error('Scenario not yet implemented...');

    }

    private getLongestIdenticalPath(firstVector: DocumentVector, lastVector: DocumentVector): number[] {

        const path: number[] = [];

        const shortestPath = firstVector.path.length > lastVector.path.length ? lastVector.path : firstVector.path;
        const longestPath = firstVector.path.length > lastVector.path.length ? firstVector.path : lastVector.path;

        for (let i = 0; i < shortestPath.length; i++) {

            if (shortestPath[i] !== longestPath[i]) {
                break;
            }

            path.push(shortestPath[i]);

        }

        return path;

    }

    public removeSelection(range: SelectionRange): { newVector: DocumentVector, latestChangedPath: number[] } {

        const longestIdenticalPath = this.getLongestIdenticalPath(range.start, range.end);
        // Remove within paragraph node:
        if (longestIdenticalPath.length > 0) {

            const node = this.getNodeByPath(longestIdenticalPath);

            const firstSplit = this.assembleBranchFromFirstLeadingToVector(longestIdenticalPath, range.start);
            const lastSplit = this.assembleBranchFromVectorToLastTrailing(longestIdenticalPath, range.end);

            if (documentNodeIsTextNode(node)) {

                if (!(documentNodeIsTextNode(firstSplit) && documentNodeIsTextNode(lastSplit))) {
                    throw new Error('Splits were of TextObject were not both of type TextObject')
                }

                const parentNode = this.getNodeByPath(longestIdenticalPath.slice(0, -1));
                if (documentNodeIsTextNode(parentNode)) {
                    throw new Error('Parent node was of type TextObject');
                }
                const indexOfChildInParentNode = getIndexOfChildInParentChildrenArray(parentNode, node);

                const mergedTextNode = generateTextObject(`${firstSplit.content}${lastSplit.content}`);

                parentNode.children.splice(indexOfChildInParentNode, 1, mergedTextNode);

                const newVector: DocumentVector = {
                    path: longestIdenticalPath,
                    index: firstSplit.content.length
                }

                return { newVector: newVector, latestChangedPath: longestIdenticalPath };

            }

            const newChildren: [TextObject | FormatObject, ...(TextObject | FormatObject)[]] = documentNodeHasChildren(firstSplit) ? [...firstSplit.children] : [firstSplit];
            const indexOfLastChildOfFirstSplit = documentNodeHasChildren(firstSplit) ? firstSplit.children.length - 1 : 0;

            if (documentNodeHasChildren(lastSplit)) {
                newChildren.splice(newChildren.length, 0, ...lastSplit.children);
            } else {
                newChildren.splice(newChildren.length, 0, lastSplit);
            }

            node.children = newChildren;

            return { newVector: this.lastTrailing([...longestIdenticalPath, indexOfLastChildOfFirstSplit]), latestChangedPath: longestIdenticalPath };

        }

        throw new Error('Cannot delete selection accross multiple paragraphs!');

    }

    // Returns the relevant formatNode and relative path from this to the node at destination vector.
    private getRelevantFormatNodeAndRelativePath(destination: DocumentVector, format: format): { relevantFormatNode: FormatObject, pathFromRelevantFormatNode: number[], pathToRelevantFormatNode: number[] } {

        // Traverse document tree until, relevantFormatNode is found.
        let pathToNode = [...destination.path];
        let node = this.getNodeByPath(pathToNode);

        for (let i = 0; i  < destination.path.length; i++) {

            if (documentNodeIsFormatNode(node)) {

                if (node.format == format) {
                    return { relevantFormatNode: node, pathFromRelevantFormatNode: getPathAfterFirst(pathToNode, destination.path), pathToRelevantFormatNode: pathToNode };
                }

            }

            // Point path to parentNode
            pathToNode = pathToNode.slice(0, -1);
            node = this.getNodeByPath(pathToNode);

        }

        // If correctNode is not found within for loop, it should not exists:
        throw new Error('Correct format node not found in any parent of destination vector.');

        function getPathAfterFirst(shortPath: number[], longPath: number[]): number[] {
            return longPath.slice(shortPath.length);
        }

    }

    // Returns firstLeading vector from path or entire document, if no path is given.
    private firstLeading(path: number[] = []): DocumentVector {

        // If path.length == 0, we want to find the first vector of the document, this must start at paragraph[0];
        let node = path.length == 0 ? this.document.paragraphs[0] : this.getNodeByPath(path);
        let localPath = [...path];

        while(documentNodeHasChildren(node)) {
            node = node.children[0];
            localPath.push(0);
        }

        return {
            path: localPath,
            index: 0
        }

    }

    // Returns lastTrailing vector from path or entire document, if no path is given.
    private lastTrailing(path: number[] = []): DocumentVector {

        let node = path.length == 0 ? this.document.paragraphs[this.document.paragraphs.length - 1] : this.getNodeByPath(path);
        let localPath = [...path];

        while(documentNodeHasChildren(node)) {
            localPath.push(node.children.length - 1);
            node = node.children[node.children.length - 1];
        }

        if (!documentNodeIsTextNode(node)) {
            throw new Error('Last trailing node was found to not be of type TextNode');
        }

        return {
            path: localPath,
            index: node.content.length
        }

    }

    // Returnes a subBranch from node at pathToStartingNode, including all nodes up until splittingVector, splitting the textNode pointed to by splittingVector
    private assembleBranchFromFirstLeadingToVector(pathToStartingNode: number[], splittingVector: DocumentVector): TextObject | FormatObject | ParagraphObject {

        // Recursive function
        const generateBranch = (path: number[]): TextObject | FormatObject | ParagraphObject => {

            // Get the node to create the branch below of:
            const node = this.getNodeByPath(path);

            // If node is a textnode, it has no children, and no branches below. Basecase:
            if (node.type == 'text') {

                // If the path to the textNode is equal to the splitting vector, we are at the node we intend to split.
                if (arraysAreDeeplyEqual(path, splittingVector.path)) {
                    if (!indexIsValid(splittingVector.index, 0, node.content.length)) {
                        throw new Error('Index of splittingVector was out of bounds with the resulting textNode');
                    }
                    return { ...node, content: node.content.substring(0, splittingVector.index)};
                } else  {
                    return node;
                }

            }

            // If the indexies of path are identical to the first indexies of splittingVector.path, we are behind the textNode, per the handling of the case of being ON the vector further below
            if (!arraysAreDeeplyEqual(path, splittingVector.path.slice(0, path.length))) {
                return node;
            }

            // Node must be ON the splitting vector, only include children, whose indexies, are at or below the next value in the splittingVector.path array
            const nodeChildren: [(FormatObject | TextObject), ...(FormatObject | TextObject)[]] = [node.children[0]];
            const numberOfChildrenAtPointInBranch = splittingVector.path[path.length] + 1;

            for (let i = 0; i < numberOfChildrenAtPointInBranch; i++) {

                const child = generateBranch([...path, i]);
                if (child.type == 'paragraph') {
                    throw new Error('ParagraphObject was returned as child');
                }
                nodeChildren[i] = child;

            }

            return { ...node, children: nodeChildren };

        }

        return generateBranch(pathToStartingNode);

    }

    // Returnes a subBranch from node at pathToStartingNode, including all nodes after splittingVector, splitting the textNode pointed to by splittingVector
    private assembleBranchFromVectorToLastTrailing(pathToStartingNode: number[], splittingVector: DocumentVector): TextObject | FormatObject | ParagraphObject {

        // Recursive function
        const generateBranch = (path: number[]): TextObject | FormatObject | ParagraphObject => {

            // Get the node to create the branch below of:
            const node = this.getNodeByPath(path);

            // If node is a textnode, it has no children, and no branches below. Basecase:
            if (node.type == 'text') {

                // If the path to the textNode is equal to the splitting vector, we are at the node we intend to split.
                if (arraysAreDeeplyEqual(path, splittingVector.path)) {
                    if (!indexIsValid(splittingVector.index, 0, node.content.length)) {
                        throw new Error('Index of splittingVector was out of bounds with the resulting textNode');
                    }
                    return { ...node, content: node.content.substring(splittingVector.index)};
                } else  {
                    return node;
                }

            }

            // If the indexies of path are identical to the first indexies of splittingVector.path, we are in front of the textNode, per the handling of the case of being ON the vector further below
            if (!arraysAreDeeplyEqual(path, splittingVector.path.slice(0, path.length))) {
                return node;
            }

            // Node must be ON the splitting vector, only include children, whose indexies, are at or above the next value in the splittingVector.path array
            const nodeChildren: [(FormatObject | TextObject), ...(FormatObject | TextObject)[]] = [node.children[node.children.length - 1]];
            const indexOfFirstChild = splittingVector.path[path.length];

            for (let i = indexOfFirstChild; i < node.children.length; i++) {

                const child = generateBranch([...path, i]);
                if (child.type == 'paragraph') {
                    throw new Error('ParagraphObject was returned as child');
                }
                nodeChildren[i - indexOfFirstChild] = child;

            }

            return { ...node, children: nodeChildren };

        }

        return generateBranch(pathToStartingNode);

    }

    // Returnes a subBranch from node at pathToStartingNode, including all nodes between startVector and endVector
    private assembleBranchFromVectorToVector(pathToStartingNode: number[], startVector: DocumentVector, endVector: DocumentVector): TextObject | FormatObject | ParagraphObject {

        const identicalPaths = arraysAreDeeplyEqual(startVector.path, endVector.path);

        const generateBranch = (path: number[]): TextObject | FormatObject | ParagraphObject => {

            // Get the node to create the branch below of:
            const node = this.getNodeByPath(path);

            // Basecase - textNode:
            if (documentNodeIsTextNode(node)) {

                // Both vectors point so same end-node:
                if (identicalPaths) {
                    // Check validity of indexies:
                    if (!(indexIsValid(startVector.index, 0, node.content.length) && indexIsValid(endVector.index, 0, node.content.length))) {
                        throw new Error('Invalid index of startVector or endVector');
                    }
                    return { ...node, content: node.content.substring(startVector.index, endVector.index) }
                }

                // Textnode on startingVector
                if (arraysAreDeeplyEqual(path, startVector.path)) {
                    if (!indexIsValid(startVector.index, 0, node.content.length)) {
                        throw new Error('Invalid index of startVector');
                    }
                    return { ...node, content: node.content.substring(startVector.index) }
                }

                // Textnode on endVector
                if (arraysAreDeeplyEqual(path, endVector.path)) {
                    if (!indexIsValid(endVector.index, 0, node.content.length)) {
                        throw new Error('Invalid index of endVector');
                    }
                    return { ...node, content: node.content.substring(0, endVector.index) };
                }

                // Default case: Textnode between vectors:
                return node;

            }

            // If neither startVector.path nor endVector.path are equal to current path, we must be between the vectors per the for-loop-logic below...
            if (!(arraysAreDeeplyEqual(path, startVector.path.slice(0, path.length)) || arraysAreDeeplyEqual(path, endVector.path.slice(0, path.length)))) {
                return node;
            }

            // If the vector paths are equal so far, we include children between the two indicies
            if (arraysAreDeeplyEqual(startVector.path.slice(0, path.length), endVector.path.slice(0, path.length))) {

                const nodeChildren: [(FormatObject | TextObject), ...(FormatObject | TextObject)[]] = [node.children[startVector.path[path.length]]];
                const indexOfFirstChild = startVector.path[path.length];
                const indexOfLastChild = endVector.path[path.length];

                for (let i = indexOfFirstChild; i < indexOfLastChild + 1; i++) {
                    const child = generateBranch([...path, i]);
                    if (child.type == 'paragraph') {
                        throw new Error('ParagraphObject was returned as child');
                    }
                    nodeChildren[i - indexOfFirstChild] = child;
                }

                return { ...node, children: nodeChildren };

            }

            // If only startVector.path is equal so far, we include all children after the vector:
            if (arraysAreDeeplyEqual(path, startVector.path.slice(0, path.length))) {

                const nodeChildren: [(FormatObject | TextObject), ...(FormatObject | TextObject)[]] = [node.children[node.children.length - 1]];
                const indexOfFirstChild = startVector.path[path.length];
    
                for (let i = indexOfFirstChild; i < node.children.length; i++) {
    
                    const child = generateBranch([...path, i]);
                    if (child.type == 'paragraph') {
                        throw new Error('ParagraphObject was returned as child');
                    }
                    nodeChildren[i - indexOfFirstChild] = child;
    
                }
    
                return { ...node, children: nodeChildren };

            }

            if (arraysAreDeeplyEqual(path, endVector.path.slice(0, path.length))) {

                const nodeChildren: [(FormatObject | TextObject), ...(FormatObject | TextObject)[]] = [node.children[0]];
                const numberOfChildrenAtPointInBranch = endVector.path[path.length] + 1;
    
                for (let i = 0; i < numberOfChildrenAtPointInBranch; i++) {
    
                    const child = generateBranch([...path, i]);
                    if (child.type == 'paragraph') {
                        throw new Error('ParagraphObject was returned as child');
                    }
                    nodeChildren[i] = child;
    
                }
    
                return { ...node, children: nodeChildren };

            }

            throw new Error('Generate branch function reached unsupported state');

        }

        return generateBranch(pathToStartingNode);

    }
    
    // Function to split a node along a DocumentVector. Function also purges objects, that only contains empty textNodes.
    private splitNodeAlongVector(vector: DocumentVector, path: number[]): { firstSplit: ParagraphObject | FormatObject | TextObject, lastSplit: ParagraphObject | FormatObject | TextObject } {

        const nodeToSplit = this.getNodeByPath(path);

        // Get contents splits of textNode.content
        if(documentNodeIsTextNode(nodeToSplit)) {
            return {
                firstSplit: generateTextObject(nodeToSplit.content.substring(0, vector.index)),
                lastSplit: generateTextObject(nodeToSplit.content.substring(vector.index))
            }
        }

        // Return branhces
        return {
            firstSplit: this.assembleBranchFromFirstLeadingToVector(path, vector),
            lastSplit: this.assembleBranchFromVectorToLastTrailing(path, vector),
        }

    }

    private purgeNodeForEmptyTextNodes(path: number[]): { purgedNode: TextObject | ParagraphObject | FormatObject | null, removedOrigin: boolean } {

        const node = this.getNodeByPath(path);

        // Basecase:
        if (documentNodeIsTextNode(node)) {
            if (node.content == '') {
                return { purgedNode: null, removedOrigin: true };
            } else  {
                return { purgedNode: node, removedOrigin: false }
            }
        }

        // We only intend to append children, where removedOrigin = false:
        const purgedChildren: (TextObject | FormatObject)[] = [];

        for (let i = 0; i < node.children.length; i++) {

            const { purgedNode, removedOrigin } = this.purgeNodeForEmptyTextNodes([...path, i]);

            if (removedOrigin == true) {
                continue;
            }
            if (purgedNode == null) {
                throw new Error('Purged node was equal to null, with removedOrigin being false');
            }
            if (documentNodeIsParagraphNode(purgedNode)) {
                throw new Error('Purged child-node was of type paragraphObject')
            }

            purgedChildren.push(purgedNode);

        }

        if (purgedChildren.length > 0) {
            return {
                purgedNode: { ...node, children: [purgedChildren[0], ...purgedChildren.slice(1)] },
                removedOrigin: false,
            }
        } else {
            return {
                purgedNode: null,
                removedOrigin: true
            }

        }

    }

    public undoFormat(destination: DocumentVector, format: format): DocumentVector {

        // The textNode that destination points to:
        const textNode = this.getTextNode(destination);

        // Relevant formatNode:
        const { relevantFormatNode, pathFromRelevantFormatNode, pathToRelevantFormatNode } = this.getRelevantFormatNodeAndRelativePath(destination, format);
        const relevantFormatNodeParentNode = this.getNodeByPath(pathToRelevantFormatNode.slice(0, -1));
        if (documentNodeIsTextNode(relevantFormatNodeParentNode)) {
            throw new Error('Relevant format node parent is a TextNode');
        }

        const indexOfFormatInParentArray = getIndexOfChildInParentChildrenArray(relevantFormatNodeParentNode, relevantFormatNode);

        // Now, check if destination is at firstLeading or lastTrailing from the relevant formatNode.
        // This is only nesecary if index is either 0 or textNode.content.length - 1
        if (destination.index == 0 || destination.index == textNode.content.length) {
            
            // Check if destination is firstLeading of relevant format node:
            const firstLeadingFromFormatNode = this.firstLeading(pathToRelevantFormatNode);
            if (documentVectorsAreDeeplyEqual(destination, firstLeadingFromFormatNode)) {
                // We want to INSERT BEFORE relevant format node.
                
                // Get formats, that the relevantFormatNode itself is nested in.
                const formatsOfFormatNode = this.getFormatsArrayOfNode(pathToRelevantFormatNode);

                // Generate textObject nested in appropriate formatObjects, filter out format that is being undone ans formats of relevant format node.
                const { node, textNodePath } = generateNestedTextObject(this.state.getSelectionFormatsArray().filter(originalFormat => !formatsOfFormatNode.concat(format).includes(originalFormat)));

                // Purge formatNode for emptyChildren:
                const { purgedNode, removedOrigin } = this.purgeNodeForEmptyTextNodes(pathToRelevantFormatNode);
                if (purgedNode == null) {
                    relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, node);
                } else {
                    if (documentNodeIsParagraphNode(purgedNode)) {
                        throw new Error('Purged format node was returned as ParagraphObject');
                    }
                    relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, node, purgedNode);
                }
                
                // Resulting vector must be the path to the format node
                return { path: [...pathToRelevantFormatNode, ...textNodePath], index: 0 };
            }

            // Check if destination is lastTrailing of relevant format node:
            const lastTrailingFromFormatNode = this.lastTrailing(pathToRelevantFormatNode);
            if (documentVectorsAreDeeplyEqual(destination, lastTrailingFromFormatNode)) {
                // Get formats, that the relevantFormatNode itself is nested in.
                const formatsOfFormatNode = this.getFormatsArrayOfNode(pathToRelevantFormatNode);

                // Generate textObject nested in appropriate formatObjects, filter out format that is being undone ans formats of relevant format node.
                const { node, textNodePath } = generateNestedTextObject(this.state.getSelectionFormatsArray().filter(originalFormat => !formatsOfFormatNode.concat(format).includes(originalFormat)));


                // Purge formatNode for emptyChildren:
                const { purgedNode, removedOrigin } = this.purgeNodeForEmptyTextNodes(pathToRelevantFormatNode);
                if (purgedNode == null) {
                    // Insert textNode
                    relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, node);
                    // Resulting vector must be the path of the format node with last index + 1
                    return { path: [...pathToRelevantFormatNode, ...textNodePath], index: 0 };
                } else {
                    if (documentNodeIsParagraphNode(purgedNode)) {
                        throw new Error('Purged format node was returned as ParagraphObject');
                    }
                    // Insert textNode
                    relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, purgedNode, node);
                    // Resulting vector must be the path of the format node with last index + 1
                    return { path: [...pathToRelevantFormatNode.slice(0, -1), pathToRelevantFormatNode[pathToRelevantFormatNode.length - 1] + 1, ...textNodePath], index: 0 }
                }
 
            }

        }

        // If we have not returned we did neither INSERT BEFORE nor INSERT AFTER, we in this case need to split relevantFormatNode along the destination vector.
        const { firstSplit, lastSplit } = this.splitNodeAlongVector(destination, pathToRelevantFormatNode);

        // Get formats, that the relevantFormatNode itself is nested in.
        const formatsOfFormatNode = this.getFormatsArrayOfNode(pathToRelevantFormatNode);

        // Generate textObject nested in appropriate formatObjects, filter out format that is being undone ans formats of relevant format node.
        const { node, textNodePath } = generateNestedTextObject(this.state.getSelectionFormatsArray().filter(originalFormat => !formatsOfFormatNode.concat(format).includes(originalFormat)));

        // Handle paragraph splitting
        if (documentNodeIsParagraphNode(firstSplit) || documentNodeIsParagraphNode(lastSplit)) {
            throw new Error('A returned node was a ParagraphObject');
        }

        relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, firstSplit, node, lastSplit);

        // Path to splits - these must be replaced with purged node
        const pathToFirstSplit = [...pathToRelevantFormatNode];
        const pathToLastSplit = [...pathToRelevantFormatNode.slice(0, -1), pathToRelevantFormatNode[pathToRelevantFormatNode.length - 1] + 2];

        const { purgedNode: firstSplitPurgedNode , removedOrigin: removedOriginFirstSplit } = this.purgeNodeForEmptyTextNodes(pathToFirstSplit);
        const { purgedNode: lastSplitPurgedNode , removedOrigin: removedOriginLastSplit } = this.purgeNodeForEmptyTextNodes(pathToLastSplit);

        // If both purgedNodes existst, replac each split with its purged node
        if (firstSplitPurgedNode && lastSplitPurgedNode) {

            if (documentNodeIsParagraphNode(firstSplitPurgedNode) || documentNodeIsParagraphNode(lastSplitPurgedNode)) {
                throw new Error('A purgedNode to be inserted as a child was a ParagraphObject');
            }
            
            // Replace firstSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, firstSplitPurgedNode);

            // Replace lastSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray + 2, 1, lastSplitPurgedNode);

            return { path: [...pathToRelevantFormatNode.slice(0, -1), pathToRelevantFormatNode[pathToRelevantFormatNode.length - 1] + 1, ...textNodePath], index: 0 }
        }

        // If only firstPurgedNode exists
        if (firstSplitPurgedNode) {

            if (documentNodeIsParagraphNode(firstSplitPurgedNode)) {
                throw new Error('A purgedNode to be inserted as a child was a ParagraphObject');
            }

            // Replace firstSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1, firstSplitPurgedNode);

            // Remove lastSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray + 2, 1);

            return { path: [...pathToRelevantFormatNode.slice(0, -1), pathToRelevantFormatNode[pathToRelevantFormatNode.length - 1] + 1, ...textNodePath], index: 0 }

        }

        // If only lastPurgedNode exists
        if (lastSplitPurgedNode) {

            if (documentNodeIsParagraphNode(lastSplitPurgedNode)) {
                throw new Error('A purgedNode to be inserted as a child was a ParagraphObject');
            }

            // Insert lastSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray + 2, 1, lastSplitPurgedNode);

            // Delete firstSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1);

            return { path: [...pathToRelevantFormatNode, ...textNodePath], index: 0 }

        }

        // Neither node exists
        if (!(firstSplitPurgedNode || lastSplitPurgedNode)) {

            // Delete lastSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray + 2, 1);

            // Delete firstSplit
            relevantFormatNodeParentNode.children.splice(indexOfFormatInParentArray, 1);

            return { path: [...pathToRelevantFormatNode, ...textNodePath], index: 0 }

        }

        throw new Error('Unsupported scenario in undoFormat -- split');

    }

    private deleteParagraph(destination: DocumentVector): DocumentVector {

        if (destination.index !== 0) {
            throw new Error(`Cannot delete paragraph if destination.index !== 0.`);
        }

        // Cannot delete first paragraph
        if (destination.path[0] == 0) {
            return destination;
        }

        // Concat paragraph children with current children
        const paragraph = this.document.paragraphs[destination.path[0]];
        
        const previousVector = this.getPreviousVector(destination);

        // Delete paragraph
        this.document.paragraphs = [...this.document.paragraphs.slice(0, destination.path[0]), ...this.document.paragraphs.slice(destination.path[0] + 1)]

        const firstParagraphChildrenLength = this.document.paragraphs[destination.path[0] - 1].children.length;

        // Concat two paragraphs
        this.document.paragraphs[destination.path[0] - 1].children = [...this.document.paragraphs[destination.path[0] - 1].children, ...paragraph.children];

        // Merge if endNode of last child of first layer of first paragraph is textNode and first node of first layer of second paragraph is textNode.
        const resultingParagraph = this.document.paragraphs[destination.path[0] - 1];
        
        // If no node is after the original first paragraph node, render immediatly, don't merge.
        if (!resultingParagraph.children[firstParagraphChildrenLength]) {
            return previousVector;
        }
        
        // Merge nodes:
        if (documentNodeIsTextNode(resultingParagraph.children[firstParagraphChildrenLength - 1]) && documentNodeIsTextNode(resultingParagraph.children[firstParagraphChildrenLength])) {
            
            const firstNode = resultingParagraph.children[firstParagraphChildrenLength - 1];
            const lastNode = resultingParagraph.children[firstParagraphChildrenLength]
            
            // Mergen content to firstNode
            if (documentNodeIsTextNode(firstNode) && documentNodeIsTextNode(lastNode)) {
                firstNode.content += lastNode.content;
            }

            // Remove lastNode:
            resultingParagraph.children.splice(firstParagraphChildrenLength, 1);

        }

        return previousVector;

    }

    // Returnes an object with information on formats applied to the given destination vector
    public getFormats(destination: DocumentVector): FormatFlags {

        const destinationFormats = generateFormatFlagsObject();

        for (let i = 1; i < destination.path.length - 1; i++) {

            const node = this.getNodeByPath(destination.path.slice(0, -i));

            if (documentNodeIsFormatNode(node)) {
                destinationFormats[node.format] = true;
            }

        }

        return destinationFormats;

    }

    // Returnes an object with information on formats applied to the given range. All textNodes must have a specific format for function to return true for that format.
    public getFormatsSelection(range: SelectionRange): FormatFlags {

        const longestIdenticalPath = this.getLongestIdenticalPath(range.start, range.end);
        const formatFlags: FormatFlags = {
            'em': false,
            'strong': false,
            'u': false,
            'title': false
        }

        if (longestIdenticalPath.length > 0) {

            const formatsOfRootNode = this.getFormatsArrayOfNode(longestIdenticalPath);
            formatsOfRootNode.forEach(format => { formatFlags[format] = true });
            
            // Get formats for vectors to all textNodes within the range. 
            const selectedBranch = this.assembleBranchFromVectorToVector(longestIdenticalPath, range.start, range.end);
            const { totalTextNodes, formatCounts } = this.countTextnodesAndFormatsFromNode(selectedBranch, longestIdenticalPath);

            const formats = Object.keys(formatCounts) as format[];
            formats.forEach(format => {
                if (formatCounts[format] == totalTextNodes) {
                    formatFlags[format] = true;
                }
            });

            return formatFlags;

        }

        return formatFlags;

    }

    private countTextnodesAndFormatsFromNode(node: TextObject | FormatObject | ParagraphObject, pathToNode: number[]): { totalTextNodes: number, formatCounts: Record<format, number> } {
    
        const formatCounts = {
            'em': 0,
            'strong': 0,
            'u': 0,
            'title': 0
        }

        if (documentNodeIsTextNode(node)) {
            updateFormatCounts(this.getFormatsArrayOfNode(pathToNode));
            return { totalTextNodes: 1, formatCounts: formatCounts };
        }

        let textNodeCount = 0;
        
        // Recursive textNode finding function
        const countTextNodes = (localPath: number[] = []) => {

            const localNode = localPath.length > 0 ? getSubNodeInNode(node, localPath) : node;

            if (documentNodeIsTextNode(localNode)) {
                textNodeCount++;
                updateFormatCounts(getFomrtasArrayOfNodeInSubNode(node, localPath));
                return;
            }

            for (let i = 0; i < localNode.children.length; i++) {
                countTextNodes([...localPath, i]);
            }

        }

        countTextNodes();

        return { totalTextNodes: textNodeCount, formatCounts: formatCounts };

        function updateFormatCounts(flags: format[]) {
            flags.forEach(flag => {
                formatCounts[flag]++
            })
        }

    }

    // Function returns an array of formats that the node pointed to by the path is nested in.
    private getFormatsArrayOfNode(path: number[]): format[] {

        const formats: format[] = [];

        for (let i = 1; i < path.length; i++) {
            const node = this.getNodeByPath(path.slice(0, -i));
            if (documentNodeIsFormatNode(node)) {
                formats.push(node.format);
            }
        }

        return formats;

    }

    // Function to purge node for a certain format - unpacking the children of his formatNode in the parent node.
    private purgeFormat(node: TextObject | FormatObject | ParagraphObject, format: format): TextObject | FormatObject | ParagraphObject {

        if (documentNodeIsTextNode(node)) { return node };

        for (let i = 0; i < node.children.length; i++) {

            const child = node.children[i];

            if (documentNodeIsFormatNode(child) && child.format === format) {
                node.children.splice(i, 1, ...child.children);
            }

        }

        for (let i = 0; i < node.children.length; i++) {

            const child = this.purgeFormat(node.children[i], format);
            if (documentNodeIsParagraphNode(child)) {
                throw new Error('Document node child was a paragraph...');
            }
            node.children[i] = child;

        }

        // Join adjacent textNodes:
        for (let i = node.children.length - 1; i > 0; i--) {

            const previousChild = node.children[i - 1];
            const currentChild = node.children[i];

            if (documentNodeIsTextNode(previousChild) && documentNodeIsTextNode(currentChild)) {
                previousChild.content += currentChild.content;
                node.children.splice(i, 1);
            }

        }

        return node;

    }

}

export default DocumentOperator;
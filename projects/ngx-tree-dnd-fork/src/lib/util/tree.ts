import { TreeItemContents, TreeItemOptions } from "../models/tree-view.model";

export interface INodeData {
    id: number;
    name: string;
    contents?: TreeItemContents;
    options?: TreeItemOptions;
}

export class Node {
    private _data: INodeData;
    private _parent: Node;
    private _children: Node[];

    constructor(data: INodeData, parent: Node = null, children: Node[]=[]) {
        this._data = data;
        this._parent = parent;
        this._children = children;
    }

    get data(): INodeData {
        return this._data;
    }

    get parent(): Node {
        return this._parent;
    }

    set parent(val: Node) {
        this._parent = val;
    }

    get children(): Node[] {
        return this._children;
    }

    addChild(child: Node) {
        this._children.push(child);
    }

    removeChild(childId: number) {
        let indexOfChild = this._children.findIndex(c => c.data.id == childId);
        if(indexOfChild != -1)
            this._children.splice(indexOfChild, 1);
    }
}

export class Tree {
    private _root: Node = null;

    constructor(data: INodeData) {
        this._root = new Node(data);
    }

    getRoot(): Node {
        return this._root;
    }

    getNode(currentNode: Node, nodeId: number):Node {
        for(let c of currentNode.children) {
            if(c.data.id == nodeId)
                return c;
            return this.getNode(c, nodeId);
        }
    }

    add(child: Node, parentId: number) {
        let parentNode = this.getNode(this._root, parentId);
        if(parentNode != null) {
            child.parent = parentNode;
            parentNode.addChild(child);
        }
    }

    remove(child: Node, parentId: number) {
        let parentNode = this.getNode(this._root, parentId);
        if (parentNode != null) {
            parentNode.removeChild(child.data.id);
        }
    }

    getLevelItemCount(level: number = 0): number {
        // For now, returns only first level item count
        return this._root.children.length;
    }

}
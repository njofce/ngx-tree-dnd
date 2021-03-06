import { Injectable, QueryList } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { TreeModel, TreeConfig, TreeDto } from './models/tree-view.model';
import { TreeItemType } from './models/tree-view.enum';
import * as moment_ from 'moment';
import { NgxTreeChildrenComponent } from './ngx-tree-dnd-fork-children/ngx-tree-dnd-fork-children.component';
import { Tree, Node, INodeData } from './util/tree';

const moment = moment_;

@Injectable({
  providedIn: 'root'
})
export class NgxTreeService {

  private childrenElementList: QueryList<NgxTreeChildrenComponent>;

  rootTitle: string = 'Root';
  private _tree: Tree;

  get tree(): Tree {
    return this._tree;
  }

  isDragging: Node;
  dragEvent: {};
  direction: string;
  lastExpandState: boolean;
  onDragStart = new Subject<any>();
  onDragEnter = new Subject<any>();
  onDragLeave = new Subject<any>();
  onDrop = new Subject<any>();
  onDrag = new Subject<any>();
  onAllowDrop = new Subject<any>();
  onDragEnd = new Subject<any>();
  onDragEndChildCheck = new Subject<any>();
  onIndent = new Subject<number>();
  onOutdent = new Subject<any>();
  onItemUpdate = new Subject<any>();
  onAddItem = new Subject<any>();
  onRenameItem = new Subject<any>();
  onStartRenameItem = new Subject<any>();
  onFinishRenameItem = new Subject<any>();
  onRemoveItem = new Subject<any>();
  config = new BehaviorSubject<any>(null);

  eventSubj = new Subject<any>();

  defaulConfig: TreeConfig = {
    showActionButtons: true,
    showAddButtons: true,
    showRenameButtons: true,
    showDeleteButtons: true,
    enableExpandButtons: true,
    showRootAddButton: true,
    enableDragging: true,
    rootTitle: 'Root',
    validationText: 'Enter valid name',
    minCharacterLength: 1,
    setItemsAsLinks: false,
    dateFormat: "YYYY-MM-DD",
    setFontSize: 12,
    setIconSize: 12,
    autoDateInsert: false,
    autoInsert: false,
    firstLevelLimit: 20
  };

  errorNotification = new Subject<string>();

  constructor() {}

  private flatten = (children, getChildren, level) => Array.prototype.concat.apply(
    children.map(x => ({ children: x.children, id: x.data.id, level: level || 1 })),
    children.map(x => this.flatten(getChildren(x) || [], getChildren, (level || 1) + 1))
  );

  private extractChildren = x => x.children;

  public updateDefaultConfig(config:TreeConfig) {
    for (const key of Object.keys(config)) {
      this.setValue(key, config);
    }
  }

  public flatTree(root: Node) {
    let res = [];
    if(root.data.options.hideChildrens)
      return [root];
    for(let c of root.children) {
      res.push(c);
      (!c.data.options.hideChildrens) && (res = res.concat(this.flatTree(c)))
    }

    return res;
  }

  public setValue(item, config) {
    this.defaulConfig[item] = config[item];
  }

  public countFirstLevelItems() {
    return this._tree.getLevelItemCount();
  }

  public getNodeLevel(nodeId: number) {
    let flat = this.flatten(this.extractChildren(this._tree.getRoot()), this.extractChildren, 0)
    .map(x => delete x.children && x)
    .find(x => x.id == nodeId);

    return flat ? flat.level : 0;
  }

  public updateItemDateConsistencyIndicators(itemIds: number[]) {
    this.updateDateConsistency(this._tree.getRoot().children, itemIds);
    this.eventSubj.next();
  }

  private updateDateConsistency(children: Node[], itemIds: number[]) {
    children.forEach(n => {
      n.data.contents.consistentDate = true;

      if (itemIds.indexOf(n.data.id) != -1)
        n.data.contents.consistentDate = false;

      n.children.forEach(ch => {
        ch.data.contents.consistentDate = true;
        if(itemIds.indexOf(ch.data.id) != -1) {
          ch.data.contents.consistentDate = false;
        }
        if(ch.data.contents.type == TreeItemType.TaskGroup) {
          this.updateDateConsistency(ch.children, itemIds);
        }
      })

    })
  }

  public transformLocalData(treeModel: TreeModel[]):Tree {
    this._tree = new Tree({
      id: 0,
      name: this.rootTitle,
      contents: null,
      options: {
        position: 0,
        edit: false
      }
    });

    this.addTreeModelElementsToTree(this.tree.getRoot(), treeModel);
    
    return this.tree;
  }

  addTreeModelElementsToTree(currentNode: Node, tm: TreeModel[]) {
    for (let t of tm) {
      let nodeData: INodeData = {
        id: t.id,
        name: t.name,
        options: {
          position: 0,
          edit: false
        },
        contents: {
          title: t.name,
          type: t.contents.type,
          duration: t.contents.duration,
          startDate: t.contents.startDate,
          endDate: t.contents.endDate,
          active: t.contents.active
        },
      }
      let parent = t.parentId != null ? this._tree.getNode(this._tree.getRoot(), t.parentId) : this._tree.getRoot();
      let n: Node = new Node(nodeData, parent);
      currentNode.addChild(n);
      this.addTreeModelElementsToTree(n, t.childrens);
    }
  }

  private transformTreeToTreeModel(tm: TreeModel[], treeNodes: Node[]) {
    treeNodes.forEach(node => {
      tm.push({
        id: node.data.id,
        name: node.data.name,
        parentId: node.parent.data.id,
        childrens: [],
        contents: node.data.contents,
        options: node.data.options
      })

      this.transformTreeToTreeModel(tm[tm.findIndex(t => t.id == node.data.id)].childrens, node.children);
    })
  }

  public getTreeData(): Observable<TreeDto> {
    let treeModel: TreeModel[] = [];
    this.transformTreeToTreeModel(treeModel, this._tree.getRoot().children);

    return new Observable(observer => {
      observer.next({
        rootTitle: this.rootTitle,
        treeStorage: treeModel.filter(val => val.contents.type == TreeItemType.TaskGroup)
      });
    })
  }

  private autoSaveItems(list: QueryList<NgxTreeChildrenComponent>) {
    list.forEach((ch: NgxTreeChildrenComponent) => {
      if(ch.childrenElementList.length != 0)
        this.autoSaveItems(ch.childrenElementList);
      if (ch.treeNode.data.options.edit){
        this.finishEditItem(ch.itemEditForm.value, ch.treeNode.data.id);
      }
    })
    this.eventSubj.next();
  }

  public toggleChildrenVisibility(node: Node, b: boolean) {
    if (node.data.options.hideChildrens != b) {
      node.data.options.hideChildrens = b;
      this.eventSubj.next();
    }
  }

  public addNewItem(id: number, name: string = "", parentId: number = 0, type: TreeItemType = TreeItemType.TaskGroup) {
    let text = null;
    let startDate = moment().format(this.defaulConfig.dateFormat);
    let endDate = moment().add(type == TreeItemType.Milestone ? 0 : 1, "d").format(this.defaulConfig.dateFormat);
    let duration = moment(endDate).diff(moment(startDate), 'days');
    
    let parent: Node = this._tree.getNode(this._tree.getRoot(), parentId);

    let pos = 1;
    if (parent != null && parent.children.length !== 0) {
      const parentPrevChildren = parent.children.length - 1;
      const newItemPosition = parent.children[parentPrevChildren].data.options.position + 1;
      pos = newItemPosition;
    }

    // Text auto Insert
    if (this.defaulConfig.autoInsert && !parent) {
      text = this.defaulConfig.autoInsertDefaultString + " " + (this.tree.getLevelItemCount() + 1);
    }
    if (this.defaulConfig.autoDateInsert) {
      // Task Group Level
      if (parent.data.id == 0) {
        if (this.tree.getLevelItemCount() > 0) {
          startDate = this.tree.getRoot().children[this.tree.getLevelItemCount() - 1].data.contents.startDate;
          endDate = this.tree.getRoot().children[this.tree.getLevelItemCount() - 1].data.contents.endDate;
          duration = moment(endDate).diff(moment(startDate), 'days');
        }
      }
    }
    name = text != null ? text : name;

    let nodeData: INodeData = {
      id,
      name,
      options: {
        position: pos,
        edit: text == null
      },
      contents: {
        title: name,
        type: type,
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        active: true
      }
    }

    let newNode: Node = new Node(nodeData, parent);
    this._tree.add(newNode, parentId);

    this.checkTreeLength();
    this.onAddItem.next(null);
    this.eventSubj.next();
  }

  public deleteItem(id: number) {
    let node: Node = this._tree.getNode(this._tree.getRoot(), id);
    let parentId: number = node.parent.data.id;
    this._tree.remove(node, node.parent.data.id);

    this.checkTreeLength();
    this.onRemoveItem.next(parentId)
    this.eventSubj.next();
  }

  public startRenameItem(element) {
    this.onStartRenameItem.next(null);
  }

  public updateRootTitle(newTitle: string) {
    this.rootTitle = newTitle;
    this._tree.getRoot().data.name = newTitle;
    this.eventSubj.next();
  }

  public registerChildListReference(childrenElementList: QueryList<NgxTreeChildrenComponent>) {
    this.childrenElementList = childrenElementList;
  }

  public finishEditItem(formValue, id: number) {
    let node: Node = this._tree.getNode(this._tree.getRoot(), id);
    node.data.name = formValue.name != null ? formValue.name : "";
    node.data.contents = {
      id: id,
      title: node.data.name,
      startDate: formValue.startDate.format(this.defaulConfig.dateFormat),
      endDate: formValue.endDate.format(this.defaulConfig.dateFormat),
      duration: formValue.duration,
      type: formValue.itemType,
      active: formValue.itemActive
    }
    node.data.options.edit = false;

    this.checkTreeLength();
  }

  public startDragging(eventObj) {
    this.switchDropButton(true, this._tree.getRoot());
    this.onDragStart.next(eventObj);
  }

  public onDragProcess(eventObj) {
    this.onDrag.next(eventObj);
  }

  public dragEndAction(eventObj) {
    this.removeDestenationBorders(this._tree.getRoot());
    this.switchDropButton(false, this._tree.getRoot());
    this.onDragEnd.next(eventObj);
    this.eventSubj.next();
  }

  public enterDropZone(eventObj) {
    this.onDragOver(eventObj);
    this.onDragEnter.next(eventObj);
  }

  public onDragOver(eventObj) {
    const el = (eventObj.target as Node);

    if (el && el.data.id !== this.isDragging.data.id ) {
      const elementHalfHeight = eventObj.event.toElement.offsetHeight / 2;
      if (eventObj.event.offsetY < elementHalfHeight) {
        el.data.options.destenationBottom = false;
        el.data.options.destenationTop = true;
      } else  {
        el.data.options.destenationBottom = true;
        el.data.options.destenationTop = false;
      }
      this.onAllowDrop.next(eventObj);
    }
  }

  public leaveDropZone(eventObj) {
    this.removeDestenationBorders(this.tree.getRoot());
    this.onDragLeave.next(eventObj);
  }

  public onDropItem(eventObj) {    
    const el = (eventObj.target as Node);

    if ( el != undefined ) {
      let elementIndex: number = el.parent.children.findIndex(c => c.data.id == el.data.id);
      let isDraggingIndex: number = this.isDragging.parent.children.findIndex(c => c.data.id == this.isDragging.data.id);
      
      let posY = eventObj.event.offsetY - eventObj.event.toElement.offsetHeight / 2;

      if (posY < 0) {
        this.changeItemParent(this.isDragging, el.parent, isDraggingIndex > elementIndex ? elementIndex : elementIndex - 1);
      } else {
        this.changeItemParent(this.isDragging, el.parent, isDraggingIndex > elementIndex ? elementIndex + 1 : elementIndex);
      }
    }
    else {
      const dropZoneId = parseInt(eventObj.event.target.getAttribute('data-id'), null);
      let parentNode: Node = this._tree.getNode(this._tree.getRoot(), dropZoneId);
      this.changeItemParent(this.isDragging, parentNode);
    }

    this.removeDestenationBorders(this._tree.getRoot());
    this.switchDropButton(false, this._tree.getRoot());
    this.checkTreeLength();
    this.onDragEnd.next();
  }

  public displayErrorNotification(message: string) {
    this.errorNotification.next(message);
  }

  private changeItemParent(item: Node, newParent: Node, newIndex: number = null) {
    item.parent.removeChild(item.data.id);
    item.parent = newParent;
    newParent.addChild(item);

    if(newIndex != null)
      newParent.moveChildToNewPosition(item.data.id, newIndex);
  }

  public getItemPosition(itemId: number) {
    let node: Node = this._tree.getNode(this._tree.getRoot(), itemId);
    if(node == null || node.parent == null)
      return 0;
    return node.parent.children.findIndex(i => i.data.id == node.data.id) + 1;
  }

  private removeDestenationBorders(node: Node) {
    node.data.options.destenationBottom = false;
    node.data.options.destenationTop = false;

    node.children.forEach(c => {
        c.data.options.destenationBottom = false;
        c.data.options.destenationTop = false;
        this.removeDestenationBorders(c);
    })
  }

  private switchDropButton(sw: boolean, node: Node) {
    node.data.options.showActionButtons = !sw;
    if (node.data.id != this.isDragging.data.id)
      node.data.options.showDropChildZone = sw;

    node.children.forEach(n => {
      n.data.options.showActionButtons = !sw;
      if(n.data.id != this.isDragging.data.id)
        n.data.options.showDropChildZone = sw;
      
      this.switchDropButton(sw, n);
    });
    this.eventSubj.next();
  }

  public checkTreeLength() {
    if (this.tree.getRoot().children.filter(c => !c.data.options.edit).length < 2) {
      this.tree.getRoot().children[0].data.options.showDeleteButton = false;
    } else {
      for (const el of this.tree.getRoot().children) {
        if (el && el.data.options) {
          el.data.options.showDeleteButton = true;
        }
      }
    }
  }

  public performIndent(item: Node) {
    let indexOfCurrentItem = item.parent.children.findIndex(i => i.data.id == item.data.id);
    let parent: Node = item.parent.children[indexOfCurrentItem - 1];
    this.changeItemParent(item, parent);
    this.onIndent.next(parent.data.id);
    this.eventSubj.next();
  }

  public performOutdent(item: Node) {
    let currentParentId: number = item.parent.data.id;
    let parentIndex = item.parent.parent.children.findIndex(c => c.data.id == item.parent.data.id);
    this.changeItemParent(item, item.parent.parent, parentIndex + 1);
    this.onOutdent.next(currentParentId);
    this.eventSubj.next();
  }

  public canIndent(item: Node): boolean {
    if(item.parent == null)
      return false;

      let indexOfCurrentItem = item.parent.children.findIndex(i => i.data.id == item.data.id);

    if (indexOfCurrentItem == 0 || indexOfCurrentItem == -1)
        return false;

    if (item.parent.children[indexOfCurrentItem - 1].data.contents.type == TreeItemType.TaskGroup)
      return true;

    return false;
  }

  public canAdd(item: Node) {
    return item.data.contents.type == TreeItemType.TaskGroup;
  }

  public canOutdent(item: Node): boolean {
    if(item.parent == null)
      return false;
    if(item.parent.data.id == 0)
      return false;
    if (item.data.contents.type != TreeItemType.TaskGroup && item.parent.parent.data.id == 0)
      return false
    return true;
  }

  public toggleIncludeAll(toggle: boolean) {
    this._tree.toggleActive(this._tree.getRoot(), toggle);
  }

}
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

  // treeStorage: TreeModel[] = [];
  // private findingResults: FindingResults;
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
  onAddItem = new Subject<any>();
  onRenameItem = new Subject<any>();
  onStartRenameItem = new Subject<any>();
  onFinishRenameItem = new Subject<any>();
  onRemoveItem = new Subject<any>();
  onDeleteEnd = new Subject<any>();
  config = new BehaviorSubject<any>(null);
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
    setFontSize: 16,
    setIconSize: 14,
    autoDateInsert: false,
    autoInsert: false,
    firstLevelLimit: 20
  };

  errorNotification = new Subject<string>();

  constructor() {}

  public updateDefaultConfig(config:TreeConfig) {
    for (const key of Object.keys(config)) {
      this.setValue(key, config);
    }
  }

  // set value to keys of config
  setValue(item, config) {
    this.defaulConfig[item] = config[item];
  }

  public countFirstLevelItems() {
    return this._tree.getLevelItemCount();
  }

  public updateItemDateConsistencyIndicators(itemIds: number[]) {
    this.updateDateConsistency(this._tree.getRoot().children, itemIds);
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
          active: true
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
    this.autoSaveItems(this.childrenElementList);

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
  }

  public addNewItem(id: number, name: string = null, parentId: number = 0, type: TreeItemType = TreeItemType.TaskGroup) {
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
      if (!parent) {
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

    this.onAddItem.next(null);
  }

  public deleteItem(id: number) {
    let node: Node = this._tree.getNode(this._tree.getRoot(), id);
    this._tree.remove(node, node.parent.data.id);

    this.onDeleteEnd.next(null);
  }

  public startRenameItem(element) {
    this.onStartRenameItem.next(null);
  }

  public updateRootTitle(newTitle: string) {
    this.rootTitle = newTitle;
    this._tree.getRoot().data.name = newTitle;
  }

  public registerChildListReference(childrenElementList: QueryList<NgxTreeChildrenComponent>) {
    this.childrenElementList = childrenElementList;
  }

  public finishEditItem(formValue, id: number) {
    let node: Node = this._tree.getNode(this._tree.getRoot(), id);
    node.data.name = formValue.name;
    node.data.contents = {
      id: id,
      title: formValue.name,
      startDate: formValue.startDate.format(this.defaulConfig.dateFormat),
      endDate: formValue.endDate.format(this.defaulConfig.dateFormat),
      duration: formValue.duration,
      type: formValue.itemType,
      active: formValue.itemActive
    }
    node.data.options.edit = false;

    this.onFinishRenameItem.next(null);
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
  }

  public enterDropZone(eventObj) {
    this.onDragEnter.next(eventObj);
  }

  public onDragOver(eventObj) {
    const el = (eventObj.target as TreeModel);
    if (el && el.id !== this.isDragging.data.id ) {
      const elementHalfHeight = eventObj.event.toElement.offsetHeight / 2;
      if (eventObj.event.offsetY < elementHalfHeight) {
        el.options.destenationBottom = false;
        el.options.destenationTop = true;
      } else  {
        el.options.destenationBottom = true;
        el.options.destenationTop = false;
      }
      this.onAllowDrop.next(eventObj);
    }
  }

  public leaveDropZone(eventObj) {
    this.removeDestenationBorders(this.tree.getRoot());
    this.onDragLeave.next(eventObj);
  }

  public onDropItem(eventObj) {
    console.log(eventObj);
    // if ( eventObj.target ) {
    //   const elementHalfHeight = eventObj.event.toElement.offsetHeight / 2;
    //     if (  eventObj.event.offsetY < elementHalfHeight ) {
    //       this.changeItemPosition(eventObj.target, 'up');
    //     } else {
    //       this.changeItemPosition(eventObj.target, 'down');
    //     }
    //     this.onDrop.next(eventObj);
    // } else {
    //   const dropZoneId = parseInt(eventObj.event.target.getAttribute('data-id'), null);
    //   this.elementFinder(this.treeStorage, this.isDragging.id);
    //   const i = this.findingResults.itemsList.indexOf(this.findingResults.foundItem);
    //   const copyItem = this.findingResults.itemsList.splice(i, 1)[0];
    //   this.elementFinder(this.treeStorage, dropZoneId);
    //   this.findingResults.foundItem.childrens.push(copyItem);
    //   eventObj.target = this.findingResults.foundItem;
    //   this.onDrop.next(eventObj);
    // }
    // this.removeDestenationBorders(this._tree.getRoot());
    // this.switchDropButton(false, this._tree.getRoot());
    // this.checkTreeLength();
    // this.onDragEnd.next();
  }

  displayErrorNotification(message: string) {
    this.errorNotification.next(message);
  }

  private changeItemPosition(el: Node, direction: string) {
    // this.elementFinder(this.treeStorage, this.isDragging.id);
    // const i = this.findingResults.itemsList.indexOf(this.findingResults.foundItem);
    // const copyItem = this.findingResults.itemsList.splice(i, 1)[0];
    // // end test
    // const positionTarget = el.options.position;
    // this.elementFinder(this.treeStorage, el.id);
    // if (direction === 'up') {
    //   for (const items of this.findingResults.itemsList) {
    //     if ( items.options.position >= positionTarget ) {
    //       items.options.position = items.options.position + 1;
    //       copyItem.options.position = positionTarget;
    //     }
    //   }
    // } else {
    //   for (const items of this.findingResults.itemsList) {
    //     if ( items.options.position <=  positionTarget ) {
    //       items.options.position = items.options.position - 1;
    //     }
    //   }
    // }
    // copyItem.options.position = positionTarget;

  }

  getItemPosition(itemId: number) {
    let node: Node = this._tree.getNode(this._tree.getRoot(), itemId);
    if(node == null || node.parent == null)
      return 0;
    return node.parent.children.findIndex(i => i.data.id == node.data.id) + 1;
  }

  private removeDestenationBorders(node: Node) {
    node.children.forEach(c => {
      for (const item of c.children) {
        item.data.options.destenationBottom = false;
        item.data.options.destenationTop = false;
        this.removeDestenationBorders(c);
      }
    })
  }

  private switchDropButton(sw: boolean, node: Node) {
    node.children.forEach(n => {
      n.data.options.showActionButtons = !sw;
      if(n.data.id == this.isDragging.data.id)
        n.data.options.showDropChildZone = sw;
      
      this.switchDropButton(sw, n);
    });
  }

  public checkTreeLength() {
    if (this.tree.getLevelItemCount() < 2) {
      this.tree.getRoot().children[0].data.options.showDeleteButton = false;
    } else {
      for (const el of this.tree.getRoot().children) {
        if (el && el.data.options) {
          el.data.options.showDeleteButton = true;
        }
      }
    }
  }

  public canIndent(item: TreeModel) {
    let isItemAboveATaskGroup: boolean = false;


    
    return isItemAboveATaskGroup;
  }

  public canOutdent(item: TreeModel) {
    if (item.parentId == null)
      return false;
    return true;
  }


}
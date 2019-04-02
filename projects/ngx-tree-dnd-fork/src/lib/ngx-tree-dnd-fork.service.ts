/*
 Copyright (C) 2018 Yaroslav Kikot
 This project is licensed under the terms of the MIT license.
 https://github.com/Zicrael/ngx-tree-dnd-fork
 */
import { Injectable, QueryList } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { TreeModel, TreeConfig, FindingResults, TreeDto } from './models/tree-view.model';
import { TreeItemType } from './models/tree-view.enum';

import * as moment_ from 'moment';
import { NgxTreeChildrenComponent } from './ngx-tree-dnd-fork-children/ngx-tree-dnd-fork-children.component';

const moment = moment_;

@Injectable({
  providedIn: 'root'
})
export class NgxTreeService {

  private childrenElementList: QueryList<NgxTreeChildrenComponent>;

  rootTitle: string = 'Root';
  treeStorage: TreeModel[] = [];
  private findingResults: FindingResults;
  // listOfSelectedElement: TreeModel[];
  // parentOfSelected: TreeModel;
  // private selectedElement: TreeModel;
  isDragging: TreeModel;
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
    return this.treeStorage.length;
  }

  public updateItemDateConsistencyIndicators(itemIds: number[]) {
    let st = this.treeStorage;
    this.updateDateConsistency(st, itemIds);
    this.clearAction();
  }

  private updateDateConsistency(treeStorage: TreeModel[], itemIds: number[]) {
    treeStorage.forEach(tg => {
      tg.contents.consistentDate = true;

      if (itemIds.indexOf(tg.id) != -1)
        tg.contents.consistentDate = false;

      tg.childrens.forEach(ch => {
        ch.contents.consistentDate = true;
        if(itemIds.indexOf(ch.id) != -1) {
          ch.contents.consistentDate = false;
        }
        if(ch.contents.type == TreeItemType.TaskGroup) {
          this.updateDateConsistency(ch.childrens, itemIds);
        }
      })

    })
  }


  /*
    get data and set it on observable.
    if data = null set empty data array
  */
  public getLocalData(item) {
    const data = new Observable(observer => {
    this.treeStorage = item;
      if ( this.treeStorage && this.treeStorage !== null ) {
        this.checkTreeLength();
        observer.next(this.treeStorage);
      } else {
        this.treeStorage  = JSON.parse('[]');
        observer.next(this.treeStorage);
      }
    });
    return data;
  }

  public getTreeData(): Observable<TreeDto> {
    this.autoSaveItems(this.childrenElementList);
    // console.log(this.childrenElementList);

    return new Observable(observer => {
      observer.next({
        rootTitle: this.rootTitle,
        treeStorage: this.treeStorage.filter(val => val.contents.type == TreeItemType.TaskGroup)
      });
    })
  }

  private autoSaveItems(list: QueryList<NgxTreeChildrenComponent>) {
    list.forEach((ch: NgxTreeChildrenComponent) => {
      if(ch.childrenElementList.length != 0)
        this.autoSaveItems(ch.childrenElementList);
      if (ch.element.options.edit){
        this.finishEditItem(ch.itemEditForm.value, ch.element.id);
      }
    })
  }

  /*
   Element finder, it`s find element by id in tree.
   Returns: finded element, parent array.
   Watch out, this is recursive method.
  */
   private elementFinder(list, id, parent?) {
     for (const item of list) {
       if (item.id === id) {
         this.findingResults = {
           foundItem: item,
           itemsList: list
         }
         if (parent) {
           this.findingResults.parentItem = parent;
         }
         break;
       } else {
         if (item.childrens.length > 0) {
           this.elementFinder(item.childrens, id, item);
         }
       }
     }

  }


   /*
   Add new item to tree.
   Its accepts 'type' for detect add root element or children.
   Emit onAddItem Subject.
  */
  public addNewItem(id, name, parent?) {
    let text = null;
    let startDate = moment().format(this.defaulConfig.dateFormat);
    let endDate = moment().add(1, "d").format(this.defaulConfig.dateFormat);
    let duration = moment(endDate).diff(moment(startDate), 'days');
    
    let pos = 1;
    if (parent && parent.childrens.length !== 0) {
      const parentPrevChildren = parent.childrens.length - 1;
      const newItemPosition = parent.childrens[parentPrevChildren].options.position + 1;
      pos = newItemPosition;
    }


    // Text auto Insert
    if (this.defaulConfig.autoInsert && !parent) {
      text = this.defaulConfig.autoInsertDefaultString + " " + (this.treeStorage.length + 1);
    }
    if (this.defaulConfig.autoDateInsert) {
      // Task Group Level
      if (!parent) {
        if (this.treeStorage.length > 0) {
          startDate = this.treeStorage[this.treeStorage.length - 1].contents.startDate;
          endDate = this.treeStorage[this.treeStorage.length - 1].contents.endDate;
          duration = moment(endDate).diff(moment(startDate), 'days');
        }
      }
    }

    name = text != null ? text : name;
    const createObj: TreeModel = {
      id,
      name,
      parentId: parent ? parent.id : null,
      options:  {
        position: pos,
        edit: text == null
      },
      contents: {
        title: name,
        type: TreeItemType.TaskGroup,
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        active: true
      },
      childrens: []
    };
    
    if(parent != null) {
      this.elementFinder(this.treeStorage, parent ? parent.id : null);
      this.findingResults && this.findingResults.foundItem.childrens.push(createObj);
    }
    else{
      this.treeStorage.push(createObj);
    }
    
    const eventEmit = {
      element: createObj,
      parent: parent ? this.findingResults.foundItem : 'root'
    };

    this.onAddItem.next(eventEmit);
    this.clearAction();
  }

  /*
   Delete element.
   It`s accepts 'id' for find item on tree.
   Emit onRemoveItem Subject.
  */
  public deleteItem(id) {
    this.elementFinder(this.treeStorage, id);
    const eventEmit = {
      element: this.findingResults.foundItem,
      parent: this.findingResults.parentItem || 'root'
    };
    this.onRemoveItem.next(eventEmit);
    const i = this.findingResults.itemsList.indexOf(this.findingResults.foundItem);
    this.findingResults.itemsList.splice(i, 1);
    this.clearAction();
    this.checkTreeLength();
    this.onDeleteEnd.next();
  }

  /*
   Trigger start rename element.
   It`s accepts 'name' and 'id' for find item on tree and set the name.
   Emit onRenameItem Subject.
  */
 public startRenameItem(element) {
    this.elementFinder(this.treeStorage, element.id);
    // event emit
    const eventEmit = {
      element: this.findingResults.foundItem,
      parent: this.findingResults.parentItem || 'root'
    };
    this.onStartRenameItem.next(eventEmit);
  }

  /*
    Update root title
    Replaces root title with the new one
  */
  public updateRootTitle(newTitle: string) {
    this.rootTitle = newTitle;
  }

  public registerChildListReference(childrenElementList: QueryList<NgxTreeChildrenComponent>) {
    this.childrenElementList = childrenElementList;
  }

  /*
   Rename element.
   It`s accepts 'formValue' and 'id' for find item on tree and set the name.
   Emit onRenameItem Subject.
  */
  public finishEditItem(formValue, id) {
    this.elementFinder(this.treeStorage, id);
    // code
    this.findingResults.foundItem.name = formValue.name;
    this.findingResults.foundItem.contents = {
      id: this.findingResults.foundItem.id,
      title: formValue.name,
      startDate: formValue.startDate.format(this.defaulConfig.dateFormat),
      endDate: formValue.endDate.format(this.defaulConfig.dateFormat),
      duration: formValue.duration,
      type: formValue.itemType,
      active: formValue.itemActive
    }
    this.findingResults.foundItem.options.edit = false;
    // event emit
    const eventEmit = {
      element: this.findingResults.foundItem,
      parent: this.findingResults.parentItem || 'root'
    };
    this.onFinishRenameItem.next(eventEmit);
    this.clearAction();
  }

  /*
   Event: ondragstart;
   On start dragging find element my id and set option currentlyDragging true.
  */
  public startDragging(eventObj) {
    this.switchDropButton(true, this.treeStorage);
    this.onDragStart.next(eventObj);
  }

  /*
   Event: ondrag;
   Trigger dragging element
  */
  public onDragProcess(eventObj) {
    this.onDrag.next(eventObj);
  }

  /*
   Event: ondragend;
   detect end of drag action
  */
  public dragEndAction(eventObj) {
    this.removeDestenationBorders(this.treeStorage);
    this.switchDropButton(false, this.treeStorage);
    this.onDragEnd.next(eventObj);
  }

  /*
    Event: enterdropzone;
    Entering drop zone for styling items.
  */
  public enterDropZone(eventObj) {
    this.onDragEnter.next(eventObj);
  }


  /*
    Event: dragover;
    Detect hover on dropable elements
  */
  public onDragOver(eventObj) {
    const el = (eventObj.target as TreeModel);
    if (el && el.id !== this.isDragging.id ) {
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

  /*
    Event: leavedropzone;
    Leave drop zone for restyling items.
  */
  public leaveDropZone(eventObj) {
      this.removeDestenationBorders(this.treeStorage);
      this.onDragLeave.next(eventObj);
  }

  /*
    Event: ondrop;
    Its use where draggable item drop not on allowed for drop zone:
    set item option currentlyDragging false.
    return false.
 */
  public onDropItem(eventObj) {
    if ( eventObj.target ) {
      const elementHalfHeight = eventObj.event.toElement.offsetHeight / 2;
        if (  eventObj.event.offsetY < elementHalfHeight ) {
          this.changeItemPosition(eventObj.target, 'up');
        } else {
          this.changeItemPosition(eventObj.target, 'down');
        }
        this.onDrop.next(eventObj);
    } else {
      const dropZoneId = parseInt(eventObj.event.target.getAttribute('data-id'), null);
      this.elementFinder(this.treeStorage, this.isDragging.id);
      const i = this.findingResults.itemsList.indexOf(this.findingResults.foundItem);
      const copyItem = this.findingResults.itemsList.splice(i, 1)[0];
      this.elementFinder(this.treeStorage, dropZoneId);
      this.findingResults.foundItem.childrens.push(copyItem);
      // this.sortTree();
      eventObj.target = this.findingResults.foundItem;
      this.onDrop.next(eventObj);
    }
    this.removeDestenationBorders(this.treeStorage);
    this.switchDropButton(false, this.treeStorage);
    this.clearAction();
    this.checkTreeLength();
    this.onDragEnd.next();
  }

  displayErrorNotification(message: string) {
    this.errorNotification.next(message);
  }

  /*
    change position of items
    need set direction before use
  */
  private changeItemPosition(el, direction) {
    this.elementFinder(this.treeStorage, this.isDragging.id);
    const i = this.findingResults.itemsList.indexOf(this.findingResults.foundItem);
    const copyItem = this.findingResults.itemsList.splice(i, 1)[0];
    // end test
    const positionTarget = el.options.position;
    this.elementFinder(this.treeStorage, el.id);
    if (direction === 'up') {
      for (const items of this.findingResults.itemsList) {
        if ( items.options.position >= positionTarget ) {
          items.options.position = items.options.position + 1;
          copyItem.options.position = positionTarget;
        }
      }
    } else {
      for (const items of this.findingResults.itemsList) {
        if ( items.options.position <=  positionTarget ) {
          items.options.position = items.options.position - 1;
        }
      }
    }
    copyItem.options.position = positionTarget;
    this.findingResults.itemsList.push(copyItem);
    // this.sortTree();
  }

  // get position of item
  getItemPosition(item) {
    this.elementFinder(this.treeStorage, item.id);
    let position = this.findingResults.itemsList.indexOf(this.findingResults.foundItem);
    return ++position;
  }

  // sort tree byposition
  public sortTree() {
    this.sortElements(this.treeStorage);
  }

  private sortElements (tree) {
    tree.sort( this.compate );
    for (const item of tree ) {
      if (item.childrens.length > 0) {
       this.sortElements(item.childrens);
      }
    }
  }

  private compate(a, b) {
      if (a.options.position < b.options.position) {
        return -1;
      }
      if (a.options.position > b.options.position) {
        return 1;
      }
      return 0;
  }

  // clear selectedElement && isDragging from element finder.
  private clearAction() {
    this.findingResults = null;
  }

  private removeDestenationBorders(data) {
    for (const item of data) {
      item.options.destenationBottom = false;
      item.options.destenationTop = false;
      if (item.childrens.length > 0) {
        this.removeDestenationBorders(item.childrens);
      }
    }
  }

  private switchDropButton(bool, data) {
      for (const el of data) {
        el.options.showActionButtons = !bool;
        if (el.id !== this.isDragging.id) {
          el.options.showDropChildZone = bool;
        }
        if (el.childrens.length > 0) {
          this.switchDropButton(bool, el.childrens);
        }
      }
  }

  public checkTreeLength() {
    if (this.treeStorage.length < 2) {
      this.treeStorage[0].options.showDeleteButton = false;
    } else {
      for (const el of this.treeStorage) {
        if (el && el.options) {
          el.options.showDeleteButton = true;
        }
      }
    }
  }
}

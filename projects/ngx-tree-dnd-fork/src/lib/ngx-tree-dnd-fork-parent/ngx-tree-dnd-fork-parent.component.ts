import { Tree } from './../util/tree';
import { NgxTreeChildrenComponent } from './../ngx-tree-dnd-fork-children/ngx-tree-dnd-fork-children.component';
import { FormBuilder, Validators } from '@angular/forms';
import { Component, Input, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { NgxTreeService } from '../ngx-tree-dnd-fork.service';
import { TreeModel, TreeConfig } from '../models/tree-view.model';
import { TreeItemType } from '../models/tree-view.enum';
import { faPlus, faEdit, faCheck, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { TASK_GROUP_CREATE_MESSAGE, EDIT_ITEM_MESSAGE } from '../messages';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component({
  selector: 'lib-ngx-tree-component',
  templateUrl: './ngx-tree-dnd-fork-parent.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxTreeParentComponent implements AfterViewInit {

  @ViewChildren(NgxTreeChildrenComponent) childrenElementList: QueryList<NgxTreeChildrenComponent>;

  tgMessage = TASK_GROUP_CREATE_MESSAGE;
  editMessage = EDIT_ITEM_MESSAGE;
  
  faPlus = faPlus;
  faCheck = faCheck;
  faEdit = faEdit;
  faArrowDown = faArrowDown;
  
  tree: Tree = null;
  ddCh: number = 1;
  
  userConfig: TreeConfig = {
    showActionButtons: true,
    showAddButtons: true,
    showRenameButtons: true,
    showDeleteButtons: true,
    enableExpandButtons: true,
    enableDragging: true,
    rootTitle: 'Root',
    showRootAddButton: true,
    options: {
      edit: false,
      showDropChildZone: false
    },
    validationText: 'Enter valid name',
    minCharacterLength: 1,
    setItemsAsLinks: false,
    dateFormat: "YYYY-MM-DD",
    setFontSize: 14,
    setIconSize: 12,
    autoDateInsert: false,
    autoInsert: false,
    autoInsertAutoOrder: false,
    autoInsertDefaultString: '',
    firstLevelLimit: 20
  };

  showError: boolean;
  renameForm;

  private eventSub: Subscription;

  @Input()
  set config(config: TreeConfig) {
    // seal config
    Object.seal(this.userConfig);
    try {
      // if config it`s pass
      this.setConfig(config);
      this.treeService.config.next(this.userConfig);
    } catch (error) {
      // if config invalid
      this.treeService.config.next(this.treeService.defaulConfig);
    }
  }

  @Input()
  set treeData(item: TreeModel[]) {
    this.setTreeData(item);
  }

  constructor(public treeService: NgxTreeService, private fb: FormBuilder, private cd: ChangeDetectorRef, private zone: NgZone) {
    this.enableSubscribers();
    this.createForm();
  }

  ngAfterViewInit() {
    this.treeService.registerChildListReference(this.childrenElementList);
  }

  // set user config
  setConfig(config) {
    for (const key of Object.keys(config)) {
      this.setValue(key, config);
    }
    this.renameForm.patchValue({
      name: this.userConfig.rootTitle
    });
    this.treeService.updateRootTitle(this.userConfig.rootTitle);
    this.treeService.updateDefaultConfig(this.userConfig);
  }

  // set value to keys of config
  setValue(item, config) {
    this.userConfig[item] = config[item];
  }

  // subscribe to all events and emit them to user.
  enableSubscribers() {
    this.eventSub = this.treeService.onDragStart.subscribe(
      (event) => {
        this.userConfig.options.showDropChildZone = true;
      }
    );

    this.eventSub.add(this.treeService.onDragEnd.subscribe(
      (event) => {
        this.userConfig.options.showDropChildZone = false;
      }
    ));

    this.eventSub.add(this.treeService.onDragEndChildCheck.subscribe((ev) => {
      this.cd.detectChanges();
    }))

  }

  // get tree data from treeService.
  setTreeData(treeModel: TreeModel[]) {
    this.tree = this.treeService.transformLocalData(treeModel);
  }

  // create edit form
  createForm() {
    this.renameForm = this.fb.group({
      name: [this.userConfig.rootTitle || '', [
        Validators.required,
        Validators.minLength(this.userConfig.minCharacterLength)
      ]],
    });
  }

  enableRootRenameMode() {
    this.userConfig.options.edit = true;
  }

  submitAdd() {
    if (this.treeService.countFirstLevelItems() >= this.userConfig.firstLevelLimit) {
      this.treeService.displayErrorNotification("Maximum number of allowable task groups is reached");
      return;
    }
    const d = `${new Date().getFullYear()}${new Date().getDay()}${new Date().getTime()}`;
    const elemId = parseInt(d, null);
    this.treeService.addNewItem(elemId, null, 0, TreeItemType.TaskGroup);
  }

  submitRootRename() {

    if (this.renameForm.valid) {
      this.showError = false;
      this.userConfig.rootTitle = this.renameForm.value.name;
      this.userConfig.options.edit = false;
      this.treeService.updateRootTitle(this.userConfig.rootTitle);
    } else {
      this.showError = true;
    }
  }

  ngOnDestroy() {
    this.cd.detach();
  }

}
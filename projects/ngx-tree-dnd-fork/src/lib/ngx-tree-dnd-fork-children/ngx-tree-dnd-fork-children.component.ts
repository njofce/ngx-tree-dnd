import { MILESTONE_CREATE_MESSAGE, EDIT_ITEM_MESSAGE, DELETE_ITEM_MESSAGE, TASK_GROUP_CREATE_MESSAGE, TASK_CREATE_MESSAGE, ITEM_INDENT_MESSAGE, ITEM_OUTDENT_MESSAGE } from './../messages';
import { ChangeDetectorRef, NgZone, ViewChildren, QueryList } from '@angular/core';
import { Component, Input } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgxTreeService } from '../ngx-tree-dnd-fork.service';
import { TreeModel, TreeConfig, TreeItemOptions } from '../models/tree-view.model';
import { TreeItemType } from '../models/tree-view.enum';
import { Subscription } from 'rxjs';
import { faPlus, faEdit, faTimes, faArrowDown, faMinus, faCheck, faThumbtack, faStickyNote, faIndent, faOutdent } from '@fortawesome/free-solid-svg-icons';

import * as moment_ from 'moment';
const moment = moment_;

@Component({
  selector: "lib-ngx-tree-children",
  templateUrl: "./ngx-tree-dnd-fork-children.component.html"
})
export class NgxTreeChildrenComponent {

  tgMessage = TASK_GROUP_CREATE_MESSAGE;
  iIndent = ITEM_INDENT_MESSAGE;
  iOutdent = ITEM_OUTDENT_MESSAGE;
  tMessage = TASK_CREATE_MESSAGE;
  mMessage = MILESTONE_CREATE_MESSAGE;
  eMessage = EDIT_ITEM_MESSAGE;
  dMessage = DELETE_ITEM_MESSAGE;

  @ViewChildren(NgxTreeChildrenComponent) childrenElementList: QueryList<NgxTreeChildrenComponent>;

  faPlus = faPlus;
  faEdit = faEdit;
  faTimes = faTimes;
  faArrowDown = faArrowDown;
  faMinus = faMinus;
  faCheck = faCheck;
  faThumb = faThumbtack;
  faSticky = faStickyNote;
  faIndent = faIndent;
  faOutdent = faOutdent;

  startMinDate = null;
  startMaxDate = null;

  endMinDate = null;
  endMaxDate = null;

  private formValueItemTypeChangesSubscription: Subscription;
  private formValueStartDateChangesSubscription: Subscription;
  private formValueEndDateChangesSubscription: Subscription;
  private formValueDurationChangesSubscription: Subscription;

  showError: boolean;
  config: TreeConfig;
  element: TreeModel;
  dragable: boolean;
  itemOptions: TreeItemOptions;
  childrensArray: TreeModel[];
  itemEditForm: FormGroup;
  treeItemType = TreeItemType;

  // get item from parent component
  @Input()
  set setItem(data: TreeModel) {
    this.element = data;
    this.itemOptions = {
      href: "#",
      hidden: false,
      hideChildrens: false,
      position: this.treeService.getItemPosition(this.element),
      draggable: true,
      edit: false,
      showActionButtons: true,
      currentlyDragging: false,
      destenationTop: false,
      destenationBottom: false,
      disabled: false,
      showExpandButton: true,
      showDeleteButton: true
    };
    if (this.element.options) {
      this.setOptions(this.element.options);
      this.element.options = this.itemOptions;
    } else {
      this.element.options = this.itemOptions;
    }

    // enable subscribers
    this.enableSubscribers();
    // create form
    this.createForm();
  }

  constructor(
    private treeService: NgxTreeService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) {}
  
  // enable subscribe to config
  enableSubscribers() {
    this.treeService.config.subscribe(config => {
      if (config !== null) {
        this.config = config;
      } else {
        this.config = this.treeService.defaulConfig;
      }
      if (this.element.options.draggable) {
        this.element.options.draggable = this.config.enableDragging;
      }
    });
  }

  // set options to item
  setOptions(options) {
    for (const key of Object.keys(options)) {
      this.setValue(key, options);
    }
  }

  // set value to options keys
  setValue(item, options) {
    this.itemOptions[item] = options[item];
  }

  // create edit form
  createForm() {
    let itemType = this.element.contents
      ? this.element.contents.type
      : TreeItemType.TaskGroup;
    let startDate = this.element.contents
      ? moment(this.element.contents.startDate)
      : moment();
    let endDate = this.element.contents
      ? moment(this.element.contents.endDate)
      : moment().add(1, "months");
    let active = this.element.contents ? this.element.contents.active : false;

    this.itemEditForm = this.fb.group({
      name: [
        this.element.name || "",
        [
          Validators.required,
          Validators.minLength(this.config.minCharacterLength)
        ]
      ],
      duration: [endDate.diff(startDate, "days"), Validators.required],
      startDate: [startDate, Validators.required],
      endDate: [endDate, Validators.required],
      itemType: [itemType, Validators.required],
      itemActive: active
    });
    this.onChanges();
  }

  onChanges(): void {
    this.formValueItemTypeChangesSubscription = this.itemEditForm
      .get("itemType")
      .valueChanges.subscribe(val => {
        // If changed to milestone, make end date equal to start date and duration to 0
        // Else, add 1 day to start date
        if (val == TreeItemType.Milestone) {
          this.itemEditForm.patchValue(
            {
              endDate: moment(this.itemEditForm.get("startDate").value),
              duration: 0
            },
            { emitEvent: false }
          );
        } else {
          if (this.itemEditForm.get('duration').value == 0){
            this.itemEditForm.patchValue(
              {
                endDate: moment(this.itemEditForm.get("startDate").value).add(
                  1,
                  "days"
                ),
                duration: 1
              },
              { emitEvent: false }
            );
          }
        }
      });

    this.formValueStartDateChangesSubscription = this.itemEditForm
      .get("startDate")
      .valueChanges.subscribe(val => {
        // If type == milestone, change end date to equal start date
        // Else, update end date
        let v = this.itemEditForm.get("startDate").value;
        let ed = null;
        if (this.itemEditForm.get("itemType").value == TreeItemType.Milestone) {
          ed = moment(v);
        }
        else {
          ed = moment(v).add(this.itemEditForm.get('duration').value, 'days');
        }

        this.itemEditForm.patchValue(
          {
            endDate: ed
          },
          { emitEvent: false });
      });

    this.formValueEndDateChangesSubscription = this.itemEditForm
      .get("endDate")
      .valueChanges.subscribe(val => {
        // If type == milestone, change start date to equal end date
        // Else, update duration
        let v = this.itemEditForm.get("endDate").value;
        if(moment(v).isBefore(this.itemEditForm.get('startDate').value)){
          this.itemEditForm.patchValue({
            endDate: moment(this.itemEditForm.get('startDate').value)
          });
          v = this.itemEditForm.get("endDate").value;
        }
        let newItemType = this.itemEditForm.get("itemType").value;
        let newDuration = moment(v).diff(
          moment(this.itemEditForm.get("startDate").value),
          "days"
        );

        newItemType = newDuration > 0 ? (newItemType == TreeItemType.Milestone ? TreeItemType.Task : newItemType) : TreeItemType.Milestone; 
        this.itemEditForm.patchValue(
          {
            itemType: newItemType,
            duration: newDuration
          },
          { emitEvent: false }
        );

      });

    this.formValueDurationChangesSubscription = this.itemEditForm
      .get("duration")
      .valueChanges.subscribe(val => {
        if(val < 0)
          return;
        // If milestone and duration > 0, change to task, add duration days to start date and update end date
        // Else, add duration days to start date and update end date
        let endDate = moment(this.itemEditForm.get("startDate").value).add(val, "days");
        if (this.itemEditForm.get("itemType").value == TreeItemType.Milestone) {
          this.itemEditForm.patchValue(
            {
              itemType: val == 0 ? TreeItemType.Milestone : TreeItemType.Task,
              endDate: endDate
            },
            { emitEvent: false }
          );
        } else {
          this.itemEditForm.patchValue(
            {
              itemType: val == 0 ? TreeItemType.Milestone : this.itemEditForm.get("itemType").value,
              endDate: endDate
            },
            { emitEvent: false }
          );
        }
      });
  }

  /*
    Event: onStartRenameItem;
    Enable rename mode in element
    Call onStartRenameItem() from tree service.
  */
  enableRenameMode(element) {
    this.zone.run(() => {
      element.options.edit = true;
      this.treeService.startRenameItem(element);
    })
  }

  /*
    Event: onadditem;
    Generate id by new Date() by 'full year + day + time'.
    Call addNewItem() from tree service.
  */
  submitAdd(name, item, type) {
    this.zone.run(() => {
      const d = `${new Date().getFullYear()}${new Date().getDay()}${new Date().getTime()}`;
      const elemId = parseInt(d, null);
      this.treeService.addNewItem(elemId, name, item, type);
      this.element.options.hideChildrens = false;
      // this.cd.detectChanges();
    })
  }

  /*
    Event: onFinishRenameItem;
    Check is form valid.
    Call addNewItem() from tree service.
  */
  submitEdit(item) {
    this.zone.run(() => {
      if (this.itemEditForm.valid) {
        this.showError = false;
        this.treeService.finishEditItem(this.itemEditForm.value, item.id);
        this.element.options.edit = false;
      } else {
        this.showError = true;
      }
    })

  }

  /*
    Event: onremoveitem;
    Check is item edit, then if name empty delete item.
    Call deleteItem() from tree service.
  */
  onSubmitDelete(item) {
    this.zone.run(() => {
      if (!this.element.options.edit) {
        this.treeService.deleteItem(item.id);
      } else {
        if (item.name === null) {
          this.treeService.deleteItem(item.id);
        } else {
          this.element.options.edit = false;
          // this.cd.detectChanges();
        }
      }
    })
  }

  canIndent(item) {
    return true;
  }

  canOutdent(item) {
    return true;
  }

  submitIndent(item) {
    console.log(item);
  }

  submitOutdent(item) {
    console.log(item);
  }

  // after view init
  ngAfterViewCheck() {
    // console.log('check');
  }

  ngOnDestroy() {
    if (this.formValueItemTypeChangesSubscription) {
      this.formValueItemTypeChangesSubscription.unsubscribe();
      this.formValueItemTypeChangesSubscription = null;
    }

    if (this.formValueStartDateChangesSubscription) {
      this.formValueStartDateChangesSubscription.unsubscribe();
      this.formValueStartDateChangesSubscription = null;
    }

    if (this.formValueEndDateChangesSubscription) {
      this.formValueEndDateChangesSubscription.unsubscribe();
      this.formValueEndDateChangesSubscription = null;
    }

    if (this.formValueDurationChangesSubscription) {
      this.formValueDurationChangesSubscription.unsubscribe();
      this.formValueDurationChangesSubscription = null;
    }
    this.cd.detach();
  }

}
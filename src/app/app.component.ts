import { Component } from '@angular/core';
import { TreeModel, NgxTreeService, TreeConfig, TreeItemType } from 'ngx-tree-dnd-fork';
// import data from './test.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  constructor(private treeService: NgxTreeService) {
    // this.myTree.push(data);
  }

  config: TreeConfig = {
    showActionButtons: true,
    showAddButtons: true,
    showRenameButtons: true,
    showDeleteButtons: true,
    enableExpandButtons: true,
    enableDragging: true,
    rootTitle: 'Project Tree',
    validationText: 'Contents invalid',
    minCharacterLength: 7,
    setItemsAsLinks: false,
    setFontSize: 14,
    setIconSize: 10,
    firstLevelLimit: 10,
    autoInsert: false,
    autoInsertDefaultString: 'Task Group',
    autoDateInsert: true
  };

  myTree: TreeModel[] = [
    {
      name: 'Task Group - 1',
      id: 4561,
      options: {},
      parentId: null,
      contents: {
        id: 4561,
        title: 'Task Group - 2',
        type: TreeItemType.Task,
        startDate: '2019-01-27',
        endDate: '2019-08-16',
        active: true,
        duration: 250
      },
      childrens: []
    },
    {
      name: 'Task Group - 2',
      id: 123,
      parentId: null,
      contents: {
        id: 123,
        title: 'Task Group - 2',
        type: TreeItemType.TaskGroup,
        startDate: '2019-01-27',
        endDate: '2019-02-12',
        active: true,
        duration: 17
      },
      options: {
        showDeleteButton: true
      },
      childrens: []
    },
    {
      name: 'Task Group - 3',
      id: 124,
      parentId: null,
      contents: {
        id: 124,
        title: 'Task Group - 3',
        type: TreeItemType.TaskGroup,
        startDate: '2019-01-27',
        endDate: '2019-02-12',
        active: true,
        duration: 17
      },
      options: {
        showDeleteButton: true
      },
      childrens: []
    }
  ];

  getLocalData() {
    this.treeService.getTreeData().subscribe(val => {
      console.log(val);
    })
  }

  ngOnInit() {
    
  }


  onDrop(event) {
    // console.log(this.myTree);
    // console.log(event);
  }
  onDelete(event) {
    // console.log(this.myTree);
    // console.log(event);
  }
  onadditem(event) {
    // console.log(this.myTree);
    // console.log(event);
  }
  onStartRenameItem(event) {
    // console.log('start rename');
    // console.log(this.myTree);
    // console.log(event);
  }
  onFinishRenameItem(event) {
    // console.log('finish rename');
    // console.log(this.myTree);
    // console.log(event);
  }
   
}

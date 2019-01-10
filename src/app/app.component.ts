import { Component } from '@angular/core';
import { TreeModel, TreeItemType, NgxTreeService } from 'ngx-tree-dnd-fork';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  constructor(private treeService: NgxTreeService) {}

  config = {
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
    setIconSize: 10
  };

  myTree: TreeModel[] = [
    {
      name: 'Task Group - 1',
      id: 4561,
      options: {},
      contents: {
        id: 4561,
        title: 'Task Group - 2',
        type: TreeItemType.Task,
        startDate: '2019-01-27',
        endDate: '2019-08-16',
        duration: 250
      },
      childrens: []
    },
    {
      name: 'Task Group - 2',
      id: 123,
      contents: {
        id: 123,
        title: 'Task Group - 2',
        type: TreeItemType.TaskGroup,
        startDate: '2019-01-27',
        endDate: '2019-02-12',
        duration: 17
      },
      options: {
        showDeleteButton: true
      },
      childrens: [
        {
          name: 'Task - 1',
          id: 456,
          options: {},
          contents: {
            id: 456,
            title: 'Task - 1',
            type: TreeItemType.Task,
            startDate: '2019-01-27',
            endDate: '2019-02-05',
            duration: 10
          },
          childrens: []
        },
        {
          name: 'Milestone - 1',
          id: 1533,
          options: {},
          contents: {
            id: 456,
            title: 'Milestone - 1',
            type: TreeItemType.Milestone,
            startDate: '2019-02-12',
            endDate: '2019-02-12',
            duration: 0
          },
          childrens: []
        }
      ]
    }
  ];

  getLocalData() {
    this.treeService.getTreeData().subscribe(val => {
      console.log(val);
    })
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

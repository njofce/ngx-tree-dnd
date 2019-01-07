import { Pipe, PipeTransform } from '@angular/core';
import { TreeItemType } from '../models/tree-view.enum';

@Pipe({
  name: 'treeItemTypeTransform'
})
export class TreeItemTypeTransformPipe implements PipeTransform {

  transform(value: TreeItemType, args?: any): any {
    let type = 'Project';

    switch(value) {
      case TreeItemType.Task:
        type = 'Task';
        break;
      case TreeItemType.Milestone:
        type = 'Milestone';
        break;
      case TreeItemType.TaskGroup:
        type = 'Task Group';
        break;
      default:
        type = 'Project';
    }

    return type;
  }

}

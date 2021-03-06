import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AutoFocusDirective } from './directives/ngx-tree-dnd-fork-autofocus.directive';
import { DragElementsDirective } from './directives/ngx-tree-dnd-fork-drag.directive';
import { DropElementsDirective } from './directives/ngx-tree-dnd-fork-drop.directive';
import { NgxTreeParentComponent } from './ngx-tree-dnd-fork-parent/ngx-tree-dnd-fork-parent.component';
import { NgxTreeChildrenComponent } from './ngx-tree-dnd-fork-children/ngx-tree-dnd-fork-children.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCoffee, faPlus, faEdit, faMinus, faTimes, faCheck, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { TreeItemTypeTransformPipe } from './pipes/tree-item-type-transform.pipe';

library.add(faCoffee, faPlus, faEdit, faMinus, faTimes, faCheck, faArrowDown );

import { MatDatepickerModule, MatTooltipModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatCheckboxModule } from '@angular/material';
import { DateFormatterPipe } from './pipes/date-formatter.pipe';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    ScrollingModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule
  ],
  declarations: [
    AutoFocusDirective,
    DragElementsDirective,
    DropElementsDirective,
    NgxTreeParentComponent,
    NgxTreeChildrenComponent,
    TreeItemTypeTransformPipe,
    DateFormatterPipe
  ],
  exports: [
    AutoFocusDirective,
    DragElementsDirective,
    DropElementsDirective,
    NgxTreeParentComponent,
    NgxTreeChildrenComponent
  ],
  providers: [
    DateFormatterPipe
  ]
})
export class NgxTreeDndModule { }

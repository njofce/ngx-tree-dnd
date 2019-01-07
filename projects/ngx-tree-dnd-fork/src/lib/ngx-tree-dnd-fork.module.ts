import { MY_FORMATS } from './util/date-format';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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

import { MatDatepickerModule, MatSelectModule, MatFormFieldModule, MatInputModule, DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateFormatterPipe } from './pipes/date-formatter.pipe';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule
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
    DateFormatterPipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ]
})
export class NgxTreeDndModule { }

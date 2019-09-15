import { ChangeDetectorRef } from '@angular/core';
import { Directive, ElementRef, Input, HostBinding, NgZone } from '@angular/core';
import { NgxTreeService } from '../ngx-tree-dnd-fork.service';
import { fromEvent, Subscription } from 'rxjs';
import { Node } from '../util/tree';

@Directive({
  selector: '[libDragElement]'
})
export class DragElementsDirective {

  private dragSubscription: Subscription;

  constructor(private el: ElementRef, private  treeService: NgxTreeService, private cd: ChangeDetectorRef) {}

  @Input() item: Node;
  @Input() draggableValue: boolean;

  @HostBinding('draggable')
  get draggable() {
      return this.draggableValue;
  }

  ngOnInit() {
    const self = this;
    self.initSubscriptions(self, self.el.nativeElement);
  }

  initSubscriptions(context, nativeElement) {
    context.dragSubscription = fromEvent(nativeElement, 'dragstart', { passive: false }).subscribe(event => context.onDragStart(event as Event));
    context.dragSubscription.add(fromEvent(nativeElement, 'dragend', { passive: false }).subscribe(event => context.onDragEnd(event as Event)));
  }

  onDragStart(event: Event) {
    const eventObj = {
      event,
      target: this.item
    };
    this.treeService.isDragging = this.item;
    this.treeService.lastExpandState = this.item.data.options.hideChildrens;
    this.item.data.options.hideChildrens = true;
    this.item.data.options.currentlyDragging = true;
    this.treeService.startDragging(eventObj);
    event.stopPropagation();
  }
  
  onDragEnd(event: Event) {
    const eventObj = {
      event,
      target: this.item
    };
    this.item.data.options.hideChildrens = this.treeService.lastExpandState;
    this.item.data.options.currentlyDragging = false;
    this.treeService.dragEndAction(eventObj);
    event.stopPropagation();
  }

  ngOnDestroy() {
    if (this.dragSubscription) {
      this.dragSubscription.unsubscribe();
      this.dragSubscription = null;
    }
  }

}

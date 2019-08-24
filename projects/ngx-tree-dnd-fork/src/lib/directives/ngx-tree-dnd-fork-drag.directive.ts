/*
 Copyright (C) 2018 Yaroslav Kikot
 This project is licensed under the terms of the MIT license.
 https://github.com/Zicrael/ngx-tree-dnd-fork
*/
import { Directive, ElementRef, Input, HostBinding, NgZone } from '@angular/core';
import { NgxTreeService } from '../ngx-tree-dnd-fork.service';
import { fromEvent, Subscription } from 'rxjs';
import { Node } from '../util/tree';


@Directive({
  selector: '[libDragElement]'
})
export class DragElementsDirective {

  private dragSubscription: Subscription;

    constructor(private el: ElementRef, private  treeService: NgxTreeService, private zone: NgZone) {}

    @Input() item: Node;
    @Input() draggableValue: boolean;

    @HostBinding('draggable')
    get draggable() {
        return this.draggableValue;
    }

    ngOnInit() {
      const self = this;
      this.zone.runOutsideAngular(() => {
        self.initSubscriptions(self, self.el.nativeElement) ;
      });
    }

    initSubscriptions(context, nativeElement) {
      context.dragSubscription = fromEvent(nativeElement, 'dragstart', { passive: false }).subscribe(event => context.onDragStart(event as Event));
      context.dragSubscription.add(fromEvent(nativeElement, 'drag', { passive: false }).subscribe(event => context.onDrag(event as Event)));
      context.dragSubscription.add(fromEvent(nativeElement, 'dragend', { passive: false }).subscribe(event => context.onDragEnd(event as Event)));
    }

    /*
        Event: ondragstart;
        Set item as dragging and call startDragging() from tree service.
        Emit OnDragStart on tree service.
    */
    onDragStart(event: Event) {
      const eventObj = {
        event,
        target: this.item
      };
      this.treeService.isDragging = this.item;
      this.treeService.lastExpandState = this.item.data.options.hideChildrens;
      this.item.data.options.hideChildrens = true;
      this.item.data.options.currentlyDragging = true;
      // call service func
      this.treeService.startDragging(eventObj);
      event.stopPropagation();
    }

    /*
        Event: onDrag;
        trigger drag items and call onDragProcess() from tree service.
        Emit OnDrag on tree service.
    */
    onDrag(event: Event) {
      const eventObj = {
        event,
        target: this.item
      };
      this.treeService.onDragProcess(eventObj);
    }

    /*
        Event: ondragend;
        Call dragEndAction() from tree service.
        Emit OnDragEnd on tree service.
    */
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

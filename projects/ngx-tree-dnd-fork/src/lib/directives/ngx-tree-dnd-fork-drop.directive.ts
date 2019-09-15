import { Node } from './../util/tree';
import { Directive, ElementRef, Input, Output, EventEmitter, NgZone, ChangeDetectorRef } from '@angular/core';
import { NgxTreeService } from '../ngx-tree-dnd-fork.service';
import { fromEvent, Subscription } from 'rxjs';

@Directive({
  selector: '[libDropElement]'
})
export class DropElementsDirective {

    private dropSubscription: Subscription;

    constructor(private el: ElementRef, private  treeService: NgxTreeService, private zone: NgZone, private cd: ChangeDetectorRef) {
        
    }

    @Input() item: Node;
    @Output() drop = new EventEmitter();


    ngOnInit() {
        const self = this;
        self.initSubscriptions(self, self.el.nativeElement);
    }

    initSubscriptions(self, nativeElement) {
        self.dropSubscription = fromEvent(nativeElement, 'drop', { passive: false }).subscribe(event => self.onDrop(event as Event));
        self.dropSubscription.add(fromEvent(nativeElement, 'dragleave', { passive: false }).subscribe(event => self.onDragLeave(event as Event)));
        self.dropSubscription.add(fromEvent(nativeElement, 'dragenter', { passive: false }).subscribe(event => self.onDragEnter(event as Event)));

        this.zone.runOutsideAngular(() => {
            fromEvent(nativeElement, 'dragover', { passive: false }).subscribe(event => self.onDragOver(event as Event));
        })

    }

    onDragOver(event: Event) {
        const eventObj = {
            event,
            target: this.item
        };
        this.treeService.onDragOver(eventObj);
        event.preventDefault();
    }

    onDrop(event: Event) {
        const dragItem = this.treeService.isDragging;

        const eventObj = {
            event,
            target: this.item
        };

        dragItem.data.options.hideChildrens = this.treeService.lastExpandState;
        dragItem.data.options.currentlyDragging = false;
        
        if (dragItem !== eventObj.target) {
            this.treeService.onDropItem(eventObj);
        }
        event.preventDefault();
        this.cd.detectChanges();
    }

    onDragEnter(event: Event) {
        const eventObj = {
            event,
            target: this.item
        };

        this.treeService.enterDropZone(eventObj);
        this.cd.detectChanges();
    }

    onDragLeave(event: Event) {
        const eventObj = {
            event,
            target: this.item
        };

        this.treeService.leaveDropZone(eventObj);
        this.cd.detectChanges();
    }

    ngOnDestroy() {
        if(this.dropSubscription){
            this.dropSubscription.unsubscribe();
            this.dropSubscription = null;
        }
    }

}
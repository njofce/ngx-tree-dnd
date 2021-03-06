/*
 Copyright (C) 2018 Yaroslav Kikot
 This project is licensed under the terms of the MIT license.
 https://github.com/Zicrael/ngx-tree-dnd-fork
*/
import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
    selector: '[libAutoFocus]'
})
export class AutoFocusDirective implements OnInit {
    private focus = true;
    constructor(private el: ElementRef) {}

    ngOnInit() {
        this.focus && this.el.nativeElement.focus();
    }

    @Input() set autofocus(condition: boolean) {
        this.focus = condition !== false;
    }
}

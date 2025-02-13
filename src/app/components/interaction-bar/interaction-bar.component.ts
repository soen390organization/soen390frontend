import { Component, ElementRef, Renderer2 } from '@angular/core';
import { GestureController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-interaction-bar',
  imports: [CommonModule, FormsModule, RouterModule, IonicModule],
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss']
})
export class InteractionBarComponent {
  isExpanded = false;

  constructor(
    private gestureCtrl: GestureController,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.el.nativeElement.querySelector('.swipe-footer-container'),
      gestureName: 'swipe-footer',
      onMove: (detail) => {
        if (this.isExpanded) return;
        const offset = Math.max(0, -detail.deltaY);
        this.renderer.setStyle(
          this.el.nativeElement.querySelector('.swipe-footer-container'),
          'height',
          `${300 + offset}px`
        );
      },
      onEnd: (detail) => {
        const shouldExpand = detail.deltaY < -50;
        this.isExpanded = shouldExpand;
      },
    });

    gesture.enable(true);
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
}

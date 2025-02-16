import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { DirectionsComponent } from '../directions/directions.component';

@Component({
  selector: 'app-interaction-bar',
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss'],
  imports: [DirectionsComponent]
})
export class InteractionBarComponent implements AfterViewInit {
  @ViewChild('footerContainer', { static: false }) footerContainer!: ElementRef;

  public startY = 0;
  public currentY = 0;
  public isDragging = false;
  public threshold = 50; // Minimum swipe distance to trigger action

  isExpanded = false; // Track the footer's state

  ngAfterViewInit(): void {
    const footer = this.footerContainer.nativeElement;

    // **Touch Events (Mobile)**
    footer.addEventListener('touchstart', (event: TouchEvent) => this.onDragStart(event.touches[0].clientY));
    footer.addEventListener('touchmove', (event: TouchEvent) => this.onDragMove(event.touches[0].clientY, event));
    footer.addEventListener('touchend', () => this.onDragEnd());

    // **Mouse Events (Trackpad & Desktop)**
    footer.addEventListener('mousedown', (event: MouseEvent) => this.onDragStart(event.clientY));
    document.addEventListener('mousemove', (event: MouseEvent) => this.onDragMove(event.clientY));
    document.addEventListener('mouseup', () => this.onDragEnd());
  }

  /** Start dragging */
  public onDragStart(startY: number): void {
    this.startY = startY;
    this.isDragging = true;
  }

  /** Move while dragging */
  public onDragMove(currentY: number, event?: Event): void {
    if (!this.isDragging) return;

    this.currentY = currentY;
    const diff = this.startY - this.currentY;

    // Prevent scrolling while swiping
    if (event) event.preventDefault();

    // Adjust footer position dynamically
    const footer = this.footerContainer.nativeElement;
    const translateY = this.isExpanded ? -diff : 80 - diff;
    footer.style.transform = `translateY(${Math.min(Math.max(translateY, 0), 80)}%)`;
  }

  /** End dragging & determine if expansion should happen */
  public onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const swipeDistance = this.startY - this.currentY;

    if (Math.abs(swipeDistance) > this.threshold) {
      this.isExpanded = swipeDistance > 0; // Expand if swiped up, collapse if swiped down
    }

    // Reset position with smooth transition
    const footer = this.footerContainer.nativeElement;
    footer.style.transition = 'transform 0.3s ease-out';
    footer.style.transform = this.isExpanded ? 'translateY(0)' : 'translateY(80%)';
  }
}

import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, forkJoin, switchMap } from 'rxjs';
import { CalendarEvent } from 'src/app/interfaces/event.interface';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { setCurrentCalendar } from 'src/app/store/app';
import { EventDisplayComponent } from '../event-display/event-display.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-info-interaction-bar',
  imports: [
    EventDisplayComponent,
    CommonModule
  ],
  templateUrl: './user-info-interaction-bar.component.html',
  styleUrls: ['./user-info-interaction-bar.component.scss'],
})
export class UserInfoInteractionBarComponent implements AfterViewInit {

  @ViewChild('footerContainer', { static: false }) footerContainer!: ElementRef;
  @ViewChild('handleBar', { static: false }) handleBar!: ElementRef;

  public startY = 0;
  public currentY = 0;
  public isDragging = false;
  public threshold = 50; // Minimum swipe distance to trigger action
  public swipeProgress: number = 0;
  isExpanded = false; // Track the footer's state
  calendarEvents = { events: [] as CalendarEvent[], loading: true };

  constructor(
    private readonly store: Store,
    private readonly calendarService: CalendarService
  ) { }

  ngOnInit() {
    this.calendarService
      .isInitialized()
      .pipe(
        filter((ready) => ready), // Only proceed when `ready` is true
        switchMap(() => this.store.select(setCurrentCalendar)), // Wait for calendar selection
        switchMap(() =>
          forkJoin({
            calendarEvents: this.calendarService.getEventsPromise(),
          })
        )
      )
      .subscribe(({ calendarEvents }) => {
        this.calendarEvents = { events: calendarEvents, loading: false };
      });
  }

  ngAfterViewInit(): void {
    const handle = this.handleBar.nativeElement;

    // **Touch Events (Mobile)**
    handle.addEventListener('touchstart', (event: TouchEvent) =>
      this.onDragStart(event.touches[0].clientY)
    );
    handle.addEventListener('touchmove', (event: TouchEvent) =>
      this.onDragMove(event.touches[0].clientY, event)
    );
    handle.addEventListener('touchend', () => this.onDragEnd());
  }

  onShowMore() {
    this.isExpanded = !this.isExpanded;
    const footer = this.footerContainer.nativeElement;
    footer.style.transition = 'transform 0.3s ease-out';
    footer.style.transform = this.isExpanded ? 'translateY(0)' : 'translateY(80%)';
    this.swipeProgress = this.isExpanded ? 1 : 0;
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
    const baseTranslate = this.isExpanded ? 0 : 80;
    const translateY = baseTranslate - diff;
    const clampedTranslate = Math.min(Math.max(translateY, 0), 80);
    footer.style.transform = `translateY(${Math.min(Math.max(translateY, 0), 80)}%)`;
    this.swipeProgress = (80 - clampedTranslate) / 80;
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
    this.swipeProgress = this.isExpanded ? 1 : 0;
  }

}

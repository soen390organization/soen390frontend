import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LocationCardsComponent } from '../location-cards/location-cards.component';
import { Store } from '@ngrx/store';
import { PlacesService } from 'src/app/services/places/places.service';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { MapType, selectCurrentMap, selectSelectedCampus } from 'src/app/store/app';
import { Location } from 'src/app/interfaces/location.interface';
import { filter, forkJoin, Observable, switchMap } from 'rxjs';
import { DirectionsComponent } from '../directions/directions.component';
import { VisibilityService } from 'src/app/services/visibility.service';
import { CommonModule } from '@angular/common';
import { SwitchMapButtonComponent } from 'src/app/components/switch-map-button/switch-map-button.component';
import { IndoorSelectsComponent } from '../indoor-selects/indoor-selects.component';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { GoogleMapLocation } from 'src/app/interfaces/google-map-location.interface';
import { EventInfo } from 'src/app/interfaces/event-info.interface';
import { EventCardComponent } from '../event-card/event-card.component';

@Component({
  selector: 'app-interaction-bar',
  imports: [
    IndoorSelectsComponent,
    SwitchMapButtonComponent,
    LocationCardsComponent,
    DirectionsComponent,
    EventCardComponent,
    CommonModule
  ],
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss']
})
export class InteractionBarComponent implements AfterViewInit {
  @ViewChild('footerContainer', { static: false }) footerContainer!: ElementRef;
  @ViewChild('swipeArea', { static: false }) swipeArea!: ElementRef;


  public startY = 0;
  public currentY = 0;
  public isDragging = false;
  public threshold = 50; // Minimum swipe distance to trigger action
  public swipeProgress: number = 0;
  isExpanded = false; // Track the footer's state
  showIndoorSelects = false;
  campusBuildings = { locations: [] as GoogleMapLocation[], loading: true };
  pointsOfInterest = { locations: [] as Location[], loading: true };
  events = { events: [] as EventInfo[], loading: true };
  showDirections$!: Observable<boolean>;
  showPOIs$!: Observable<boolean>;

  constructor(
    private readonly store: Store,
    private readonly placesService: PlacesService,
    private readonly visibilityService: VisibilityService,
    private readonly calendarService: CalendarService
  ) {}

  ngOnInit() {
    this.store.select(selectCurrentMap).subscribe((map) => {
      this.showIndoorSelects = map === MapType.Indoor;
    });

    this.store.select(selectSelectedCampus).subscribe();

    this.placesService
      .isInitialized()
      .pipe(
        filter((ready) => ready),
        switchMap(() => this.store.select(selectSelectedCampus)),
        switchMap(() =>
          forkJoin({
            campusBuildings: this.placesService.getCampusBuildings(),
            pointsOfInterest: this.placesService.getPointsOfInterest()
          })
        )
      )
      .subscribe(({ campusBuildings, pointsOfInterest }) => {
        this.campusBuildings = { locations: campusBuildings, loading: false };
        this.pointsOfInterest = { locations: pointsOfInterest, loading: false };
      });

    this.showDirections$ = this.visibilityService.showDirections;
    this.showPOIs$ = this.visibilityService.showPOIs;

    this.calendarService.events$.subscribe((events) => {
      this.events = { events: events, loading: false };
    });
  }
  ngAfterViewInit(): void {
    this.attachSwipeListeners(this.swipeArea.nativeElement);
  }

  private attachSwipeListeners(element: HTMLElement): void {
    // ✅ Touch Events
    element.addEventListener('touchstart', (event: TouchEvent) => {
      if (event.touches.length === 1) {
        this.onDragStart(event.touches[0].clientY);
      }
    });

    element.addEventListener('touchmove', (event: TouchEvent) => {
      this.onDragMove(event.touches[0].clientY, event);
    }, { passive: false });

    element.addEventListener('touchend', () => {
      this.onDragEnd();
    });

    // ✅ Mouse Events
    element.addEventListener('mousedown', (event: MouseEvent) => {
      this.onDragStart(event.clientY);

      const onMouseMove = (moveEvent: MouseEvent) => {
        this.onDragMove(moveEvent.clientY);
      };

      const onMouseUp = () => {
        this.onDragEnd();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  handleClick(): void {
    if (this.isDragging) {
      console.log('🚫 Click ignored — user was swiping');
      return;
    }

    this.onShowMore();
  }

  onShowMore(): void {
    this.isExpanded = !this.isExpanded;
    const footer = this.footerContainer.nativeElement;
    footer.style.transition = 'transform 0.3s ease-out';
    footer.style.transform = this.isExpanded ? 'translateY(0)' : 'translateY(90%)';
    footer.style.overflowY = this.isExpanded ? 'auto' : '';
    this.swipeProgress = this.isExpanded ? 1 : 0;
  }

  onDragStart(startY: number): void {
    this.startY = startY;
    this.isDragging = true;
  }

  onDragMove(currentY: number, event?: Event): void {
    if (!this.isDragging) return;

    this.currentY = currentY;
    const diff = this.startY - this.currentY;

    if (event) event.preventDefault();

    const footer = this.footerContainer.nativeElement;
    const baseTranslate = this.isExpanded ? 0 : 90;
    const translateY = baseTranslate - diff;
    const clampedTranslate = Math.min(Math.max(translateY, 0), 80);
    footer.style.transform = `translateY(${clampedTranslate}%)`;
    this.swipeProgress = (90 - clampedTranslate) / 90;
  }

  onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
  
    const swipeDistance = this.startY - this.currentY;
  
    if (Math.abs(swipeDistance) > this.threshold) {
      this.isExpanded = swipeDistance > 0;
    }
  
    const footer = this.footerContainer.nativeElement;
    footer.classList.toggle('expanded', this.isExpanded);
  
    footer.style.transition = 'transform 0.3s ease-out';
    footer.style.transform = this.isExpanded ? 'translateY(0)' : 'translateY(90%)';
    footer.style.overflowY = this.isExpanded ? 'auto' : 'hidden'; 
  
    this.swipeProgress = this.isExpanded ? 1 : 0;
  }
  
  
}
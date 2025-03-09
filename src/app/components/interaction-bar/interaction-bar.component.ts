import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LocationCardsComponent } from '../location-cards/location-cards.component';
import { Store } from '@ngrx/store';
import { PlacesService } from 'src/app/services/places.service';
import { DirectionsService } from 'src/app/services/directions/directions.service';
import { MapType, selectCurrentMap, selectSelectedCampus } from 'src/app/store/app';
import { Location } from 'src/app/interfaces/location.interface';
import { filter, forkJoin, Observable, switchMap } from 'rxjs';
import { DirectionsComponent } from '../directions/directions.component';
import { VisibilityService } from 'src/app/services/visibility.service';
import { CommonModule } from '@angular/common';
import { SwitchMapButtonComponent } from 'src/app/components/switch-map-button/switch-map-button.component';
import { IndoorSelectsComponent } from '../indoor-selects/indoor-selects.component';

@Component({
  selector: 'app-interaction-bar',
  imports: [IndoorSelectsComponent,  SwitchMapButtonComponent, LocationCardsComponent, DirectionsComponent, CommonModule],
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss'],
})
export class InteractionBarComponent implements AfterViewInit {
  @ViewChild('footerContainer', { static: false }) footerContainer!: ElementRef;
  @ViewChild('handleBar', { static: false }) handleBar!: ElementRef;

  public startY = 0;
  public currentY = 0;
  public isDragging = false;
  public threshold = 50; // Minimum swipe distance to trigger action
  public swipeProgress: number = 0;
  isExpanded = false; // Track the footer's state
  showIndoorSelects = false;
  campusBuildings = { locations: [] as Location[], loading: true }
  pointsOfInterest = { locations: [] as Location[], loading: true }
  showDirections$!: Observable<boolean>;
  showPOIs$!: Observable<boolean>;

  constructor(
    private readonly store: Store,
    private readonly placesService: PlacesService,
    private readonly directionsService: DirectionsService
  , private visibilityService: VisibilityService) {}

  ngOnInit() {
    this.store.select(selectCurrentMap).subscribe(map => {
      console.log(map)
      if (map === MapType.Indoor) {
        this.showIndoorSelects = true;
      } else {
        this.showIndoorSelects = false;
      }
    });
    this.placesService
      .isInitialized()
      .pipe(
        filter((ready) => ready), // Only proceed when `ready` is true
        switchMap(() => this.store.select(selectSelectedCampus)), // Wait for campus selection
        switchMap(() =>
          forkJoin({
            campusBuildings: this.placesService.getCampusBuildings(),
            pointsOfInterest: this.placesService.getPointsOfInterest(),
          })
        )
      )
      .subscribe(({ campusBuildings, pointsOfInterest }) => {
        this.campusBuildings = { locations: campusBuildings, loading: false };
        this.pointsOfInterest = { locations: pointsOfInterest, loading: false };
      });

    this.showDirections$ = this.visibilityService.showDirections;
    this.showPOIs$ = this.visibilityService.showPOIs;
  }

  ngAfterViewInit(): void {
    const handle = this.handleBar.nativeElement;

    // **Touch Events (Mobile)**
    handle.addEventListener('touchstart', (event: TouchEvent) => this.onDragStart(event.touches[0].clientY));
    handle.addEventListener('touchmove', (event: TouchEvent) => this.onDragMove(event.touches[0].clientY, event));
    handle.addEventListener('touchend', () => this.onDragEnd());

    // **Mouse Events (Trackpad & Desktop)**
    // footer.addEventListener('mousedown', (event: MouseEvent) => this.onDragStart(event.clientY));
    // document.addEventListener('mousemove', (event: MouseEvent) => this.onDragMove(event.clientY));
    // document.addEventListener('mouseup', () => this.onDragEnd());
  }

  onShowMore() {
    this.isExpanded = !this.isExpanded;
    const footer = this.footerContainer.nativeElement;
    footer.style.transition = 'transform 0.3s ease-out';
    footer.style.transform = this.isExpanded
      ? 'translateY(0)'
      : 'translateY(80%)';
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
    footer.style.transform = `translateY(${Math.min(
      Math.max(translateY, 0),
      80
    )}%)`;
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
    footer.style.transform = this.isExpanded
      ? 'translateY(0)'
      : 'translateY(80%)';
    this.swipeProgress = this.isExpanded ? 1 : 0;
  }
}

import { AfterViewInit, Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { GestureController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LocationCardsComponent } from '../location-cards/location-cards.component';
import { Store } from '@ngrx/store';
import { PlacesService } from 'src/app/services/places.service';
import { selectSelectedCampus } from 'src/app/store/app';

@Component({
  selector: 'app-interaction-bar',
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, LocationCardsComponent],
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss']
})
export class InteractionBarComponent implements OnInit, AfterViewInit {
  isExpanded = false;

  constructor(
    private gestureCtrl: GestureController,
    private el: ElementRef,
    private renderer: Renderer2,
    private store: Store,
    private placesService: PlacesService
  ) {
    
  }

  ngOnInit() {
    this.placesService.isInitialized().subscribe((ready) => {
      if (ready) {
        this.store.select(selectSelectedCampus).subscribe(async (campus) => {
          console.log('Selected campus changed:', campus);
          const buildingResults = await this.placesService.getCampusBuildings();
          const posResults = await this.placesService.getPointsOfInterest();
          console.log('Campus Buildings:', buildingResults);
          console.log('Points of Interest:', posResults);
        });
      }
    });
  }

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

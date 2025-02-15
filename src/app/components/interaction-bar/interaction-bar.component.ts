import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { PlacesService } from 'src/app/services/places.service';
import { selectSelectedCampus } from 'src/app/store/app';

@Component({
  selector: 'app-interaction-bar',
  imports: [CommonModule, FormsModule, RouterModule, IonicModule],
  templateUrl: './interaction-bar.component.html',
  styleUrls: ['./interaction-bar.component.scss']
})
export class InteractionBarComponent implements OnInit {
  isExpanded = false;

  constructor(
    private store: Store,
    private placesService: PlacesService
  ) {
    
  }

  ngOnInit() {
    this.placesService.isInitialized().subscribe((ready) => {
      if (ready) {
        this.store.select(selectSelectedCampus).subscribe(async (campus) => {
          // Getters from PlacesService
          // const buildingResults = await this.placesService.getCampusBuildings();
          // const posResults = await this.placesService.getPointsOfInterest();
        });
      }
    });
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { MappedinService } from 'src/app/services/mappedIn.service';
import { selectSelectedCampus } from 'src/app/store/app';

@Component({
  selector: 'app-indoor-selects',
  imports: [FormsModule, CommonModule],
  templateUrl: './indoor-selects.component.html',
  styleUrls: ['./indoor-selects.component.scss'],
})
export class IndoorSelectsComponent implements OnInit {
  buildings: any[] = [];
  selectedBuilding: string = '67abe2bb8ea1bf000bb60d14';
  floors: any[] = [];
  selectedFloor: string = '';
  isLoadingFloors: boolean = true;

  constructor(
    private store: Store,
    private mappedInService: MappedinService,
    private concordiaDataService: ConcordiaDataService
  ) {}

  ngOnInit() {
    this.store.select(selectSelectedCampus).subscribe((currentCampus) => {
      if (currentCampus) {
        this.buildings = this.concordiaDataService
          .getBuildings(currentCampus)
          .filter((building) => building.indoorMapId);
        if (this.buildings.length > 0) {
          this.selectedBuilding = this.buildings[0].indoorMapId;
          // Force the map to update to the new building's map
          if (this.mappedInService.getMapId() !== this.selectedBuilding) {
            this.mappedInService.setMapData(this.selectedBuilding);
          }
        }
      }
    });
    this.mappedInService.getMapData().subscribe(async (map) => {
      if (map) {
        this.floors = await this.mappedInService.getFloors();
        this.selectedFloor = this.mappedInService.getCurrentFloor().id;
        this.selectedBuilding = this.mappedInService.getMapId();
        this.isLoadingFloors = false;
      }
    });
  }

  onBuildingChange(selectedBuilding: string) {
    this.isLoadingFloors = true;
    this.mappedInService.setMapData(selectedBuilding);
  }

  onFloorChange(selectedFloor: string) {
    this.mappedInService.setFloor(selectedFloor);
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { ConcordiaDataService } from 'src/app/services/concordia-data.service';
import { MappedinService } from 'src/app/services/mappedin/mappedin.service';
import { selectSelectedCampus } from 'src/app/store/app';

@Component({
  selector: 'app-indoor-selects',
  imports: [FormsModule, CommonModule],
  templateUrl: './indoor-selects.component.html',
  styleUrls: ['./indoor-selects.component.scss']
})
export class IndoorSelectsComponent implements OnInit {
  buildings: any[] = [];
  selectedBuilding: string = '';
  floors: any[] = [];
  selectedFloor: string = '';
  isLoadingFloors: boolean = true;

  constructor(
    private store: Store,
    private mappedInService: MappedinService,
    private concordiaDataService: ConcordiaDataService
  ) {}

  ngOnInit() {
    // Watch for campus changes
    this.store.select(selectSelectedCampus).subscribe((campus) => {
      if (!campus) {
        return;
      }

      this.buildings = this.concordiaDataService.getBuildings(campus).filter((b) => b.indoorMapId);

      // Only initialize mapData on first load (no existing mapId)
      if (!this.mappedInService.getMapId() && this.buildings.length > 0) {
        this.selectedBuilding = this.buildings[0].indoorMapId;
        this.mappedInService.setMapData(this.selectedBuilding);
      }
    });

    // Sync dropdown values whenever mapData changes
    this.mappedInService.getMapData().subscribe(async (map) => {
      if (!map) {
        return;
      }
      this.floors = await this.mappedInService.getFloors();
      const currentFloor = this.mappedInService.getCurrentFloor();
      this.selectedFloor = currentFloor?.id ?? '';
      this.selectedBuilding = this.mappedInService.getMapId();
      this.isLoadingFloors = false;
    });
  }

  onBuildingChange(selectedBuilding: string) {
    this.isLoadingFloors = true;
    this.mappedInService.setMapData(selectedBuilding);
    console.log('Building changed to: ', selectedBuilding);
  }

  onFloorChange(selectedFloor: string) {
    this.mappedInService.setFloor(selectedFloor);
  }
}

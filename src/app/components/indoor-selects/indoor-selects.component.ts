import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MappedinService } from 'src/app/services/mappedIn.service';

@Component({
  selector: 'app-indoor-selects',
  imports: [FormsModule, CommonModule],
  templateUrl: './indoor-selects.component.html',
  styleUrls: ['./indoor-selects.component.scss'],
})
export class IndoorSelectsComponent implements OnInit {
  floors: any[] = [];
  selectedFloor: string = '';

  constructor(private mappedInService: MappedinService) { }

  ngOnInit() {
    this.mappedInService.getMapData().subscribe(async map => {
      if (map) {
        this.floors = await this.mappedInService.getFloors();
        console.log(this.floors);
      }
    });
  }

  buildings: string[] = ['Hall Building (H)', 'JMSB Building (MB)', 'Central Building (CC)', 'Vanier Library (VE/VL)'];
  selectedBuilding: string = this.buildings[0]; 

  onBuildingChange() {
    console.log('Selected Building:', this.selectedBuilding);
  }

  onFloorChange(selectedFloor: string) {
    this.mappedInService.setFloor(selectedFloor);
  }
}

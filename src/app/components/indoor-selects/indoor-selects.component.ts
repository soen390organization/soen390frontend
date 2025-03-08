import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-indoor-selects',
  imports: [FormsModule, CommonModule],
  templateUrl: './indoor-selects.component.html',
  styleUrls: ['./indoor-selects.component.scss'],
})
export class IndoorSelectsComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

  buildings: string[] = ['Hall Building (H)', 'JMSB Building (MB)', 'Central Building (CC)', 'Vanier Library (VE/VL)'];
  selectedBuilding: string = this.buildings[0]; 

  onBuildingChange() {
    console.log('Selected Building:', this.selectedBuilding);
  }

}

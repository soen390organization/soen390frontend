import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSelectedCampus, setSelectedCampus } from 'src/app/store/app';
import { GoogleMapService } from 'src/app/services/google-map.service';
import { PlacesService } from 'src/app/services/places/places.service';
import { Observable, take } from 'rxjs';
import data from 'src/assets/ConcordiaData.json';

@Component({
  selector: 'app-switch-campus-button',
  imports: [CommonModule],
  templateUrl: './switch-campus-button.component.html',
  styleUrls: ['./switch-campus-button.component.scss']
})
export class SwitchCampusButtonComponent {
  selectedCampus$: Observable<string>;
  // Consider Moving to places API or 1 service
  campusData: any = data;

  constructor(private readonly store: Store, private readonly googleMapService: GoogleMapService) {
    this.selectedCampus$ = this.store.select(selectSelectedCampus);
  }

  switchCampus() {
    this.selectedCampus$.pipe(take(1)).subscribe((currentCampus) => {
      let campus = currentCampus === 'sgw' ? 'loy' : 'sgw';
      let location = new google.maps.LatLng(
        this.campusData[campus].coordinates.lat,
        this.campusData[campus].coordinates.lng
      );

      this.store.dispatch(setSelectedCampus({ campus }));
      this.googleMapService.updateMapLocation(location);
    });
  }
}

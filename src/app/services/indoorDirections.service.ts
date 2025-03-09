import { Injectable } from '@angular/core';
import { MappedinService } from './mappedin.service';
import { Observable, firstValueFrom } from 'rxjs';
import { MapData, MapView } from '@mappedin/mappedin-js';

@Injectable({
    providedIn: 'root',
})
export class IndoorDirectionsService{
    constructor(private mappedInService: MappedInService) {}

    
}
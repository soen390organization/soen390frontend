import { createReducer, on } from '@ngrx/store';
import { setSelectedCampus, setMapType } from './app.actions';
import { MapType } from 'src/app/enums/map-type.enum';

export interface AppState {
  selectedCampus: string;
  currentMap: MapType;
}

export const initialState: AppState = {
  selectedCampus: 'sgw',
  currentMap: MapType.Outdoor,
};

export const appReducer = createReducer(
  initialState,
  on(setSelectedCampus, (state, { campus }) => ({ ...state, selectedCampus: campus })),
  on(setMapType, (state, { mapType }) => ({ ...state, currentMap: mapType }))
);

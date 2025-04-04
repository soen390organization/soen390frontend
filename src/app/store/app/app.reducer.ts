import { createReducer, on } from '@ngrx/store';
import { setShowRoute, setSelectedCampus, setMapType } from './app.actions';
import { MapType } from 'src/app/enums/map-type.enum';

export interface AppState {
  showRoute: boolean;
  selectedCampus: string;
  currentMap: MapType;
}

export const initialState: AppState = {
  showRoute: false,
  selectedCampus: 'sgw',
  currentMap: MapType.Outdoor
};

export const appReducer = createReducer(
  initialState,
  on(setShowRoute, (state, { show }) => ({ ...state, showRoute: show })),
  on(setSelectedCampus, (state, { campus }) => ({
    ...state,
    selectedCampus: campus
  })),
  on(setMapType, (state, { mapType }) => ({ ...state, currentMap: mapType }))
);

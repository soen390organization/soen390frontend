import { createReducer, on } from '@ngrx/store';
import { setSelectedCampus, setMapType, setCurrentCalendar } from './app.actions';
import { MapType } from 'src/app/enums/map-type.enum';
import { CalendarEvent } from 'src/app/interfaces/event.interface';


export interface AppState {
  selectedCampus: string;
  currentMap: MapType;
  currentCalendar: CalendarEvent[];
}

export const initialState: AppState = {
  selectedCampus: 'sgw',
  currentMap: MapType.Outdoor,
  currentCalendar: []
};

export const appReducer = createReducer(
  initialState,
  on(setSelectedCampus, (state, { campus }) => ({
    ...state,
    selectedCampus: campus
  })),
  on(setMapType, (state, { mapType }) => ({ ...state, currentMap: mapType })),
  on(setCurrentCalendar, (state, { newCalendar }) => ({ ...state, currentCalendar: newCalendar }))
);

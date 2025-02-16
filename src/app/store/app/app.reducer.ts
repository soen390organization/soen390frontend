import { createReducer, on } from '@ngrx/store';
import { setSelectedCampus } from './app.actions';

export interface AppState {
  selectedCampus: string;
}

export const initialState: AppState = {
  selectedCampus: 'sgw'
};

export const appReducer = createReducer(
  initialState,
  on(setSelectedCampus, (state, { campus }) => ({ ...state, selectedCampus: campus }))
);

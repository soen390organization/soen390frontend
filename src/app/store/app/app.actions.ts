import { createAction, props } from '@ngrx/store';

export const setSelectedCampus = createAction(
  '[App] Set Selected Campus',
  props<{ campus: string }>()
);

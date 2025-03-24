import { createAction, props } from '@ngrx/store';
import { MapType } from 'src/app/enums/map-type.enum';

export const setShowRoute = createAction(
  '[App] Set Show Route',
  props<{ show: boolean }>()
);

export const setSelectedCampus = createAction(
  '[App] Set Selected Campus',
  props<{ campus: string }>()
);

export const setMapType = createAction('[App] Set Map Type', props<{ mapType: MapType }>());

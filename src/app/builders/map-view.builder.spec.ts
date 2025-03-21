import { MapViewBuilder } from './map-view.builder';
import * as mappedin from '@mappedin/mappedin-js';

describe('MapViewBuilder', () => {
  let builder: MapViewBuilder;
  let fakeMapView: any;
  let fakeMapData: any;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');

    fakeMapView = {
      currentFloor: { id: 'floor1' },
      Labels: { add: jasmine.createSpy('add') },
      updateState: jasmine.createSpy('updateState')
    };

    fakeMapData = {
      getByType: (type: string) => {
        switch (type) {
          case 'space':
            return [{ name: 'Space A' }, { name: '' }, {}];
          case 'point-of-interest':
            return [
              { name: 'Bathrooms' },
              { name: 'Water Fountain' },
              { name: 'Lobby' },
              { name: '' }
            ];
          case 'connection':
            return [
              {
                type: 'stairs',
                coordinates: [{ floorId: 'floor1', x: 0, y: 0 }]
              },
              {
                type: 'elevator',
                coordinates: [{ floorId: 'floor1', x: 1, y: 1 }]
              },
              {
                type: 'other',
                coordinates: [{ floorId: 'floor1', x: 2, y: 2 }]
              },
              {
                type: 'stairs',
                coordinates: [{ floorId: 'floor2', x: 3, y: 3 }]
              }
            ];
          default:
            return [];
        }
      }
    };

    // Inject the spy as the show3dMap dependency.
    const show3dMapSpy = jasmine.createSpy().and.returnValue(Promise.resolve(fakeMapView));
    builder = new MapViewBuilder(show3dMapSpy);
    builder.setContainer(container);
    builder.setMapData(fakeMapData);
  });

  it('should return itself for setContainer and setMapData (chainability)', () => {
    expect(builder.setContainer(container)).toBe(builder);
    expect(builder.setMapData(fakeMapData)).toBe(builder);
  });

  it('should build map view and initialize labels and states correctly', async () => {
    const result = await builder.build();
    expect(result).toBe(fakeMapView);

    const spaces = fakeMapData.getByType('space');
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      spaces[0],
      'Space A',
      jasmine.objectContaining({ interactive: true })
    );

    const pois = fakeMapData.getByType('point-of-interest');
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      pois[0],
      'Bathrooms',
      jasmine.objectContaining({
        appearance: jasmine.objectContaining({
          marker: jasmine.objectContaining({ foregroundColor: { active: '#1d63dc' } }),
          text: jasmine.objectContaining({ foregroundColor: '#1d63dc' })
        })
      })
    );
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      pois[1],
      'Water Fountain',
      jasmine.objectContaining({
        appearance: jasmine.objectContaining({
          marker: jasmine.objectContaining({ foregroundColor: { active: '#1d63dc' } }),
          text: jasmine.objectContaining({ foregroundColor: '#1d63dc' })
        })
      })
    );
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      pois[2],
      'Lobby',
      jasmine.objectContaining({
        appearance: jasmine.objectContaining({
          marker: jasmine.objectContaining({ foregroundColor: { active: '#000000' } }),
          text: jasmine.objectContaining({ foregroundColor: '#000000' })
        })
      })
    );

    const connections = fakeMapData.getByType('connection');
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      connections[0].coordinates[0],
      'Stairs',
      jasmine.objectContaining({
        appearance: jasmine.objectContaining({
          marker: jasmine.objectContaining({ foregroundColor: { active: '#228C22' } }),
          text: jasmine.objectContaining({ foregroundColor: '#228C22' })
        })
      })
    );
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      connections[1].coordinates[0],
      'Elevator',
      jasmine.objectContaining({
        appearance: jasmine.objectContaining({
          marker: jasmine.objectContaining({ foregroundColor: { active: '#a000c8' } }),
          text: jasmine.objectContaining({ foregroundColor: '#a000c8' })
        })
      })
    );
    expect(fakeMapView.Labels.add).toHaveBeenCalledWith(
      connections[2].coordinates[0],
      undefined,
      jasmine.objectContaining({
        appearance: jasmine.objectContaining({
          marker: jasmine.objectContaining({ foregroundColor: { active: '#000000' } }),
          text: jasmine.objectContaining({ foregroundColor: '#000000' })
        })
      })
    );    
    expect(fakeMapView.Labels.add).not.toHaveBeenCalledWith(
      connections[3].coordinates[0],
      'Stairs',
      jasmine.any(Object)
    );

    expect(fakeMapView.updateState).toHaveBeenCalledWith(
      mappedin.DOORS.Exterior,
      { visible: true, color: 'black', opacity: 0.6 }
    );
    expect(fakeMapView.updateState).toHaveBeenCalledWith(
      mappedin.DOORS.Interior,
      { visible: true, color: 'lightgrey', opacity: 0.3 }
    );
  });
});

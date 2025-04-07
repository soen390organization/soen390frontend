import { show3dMap as defaultShow3dMap, MapData, MapView, DOORS } from '@mappedin/mappedin-js';

export class MapViewBuilder {
  container: HTMLElement;
  mapData: MapData;
  private readonly _show3dMap: (container: HTMLElement, mapData: MapData) => Promise<MapView>;

  constructor(
    show3dMap: (container: HTMLElement, mapData: MapData) => Promise<MapView> = defaultShow3dMap
  ) {
    this._show3dMap = show3dMap;
  }

  public setContainer(container: HTMLElement) {
    this.container = container;
    return this;
  }

  public setMapData(mapData: MapData) {
    this.mapData = mapData;
    return this;
  }

  private initializeSpaces(mapView: MapView): void {
    this.mapData.getByType('space').forEach((space) => {
      if (space.name) {
        this.addMapViewLabel(mapView, space, space.name);
      }
    });
  }

  private initializePointsOfInterests(mapView: MapView): void {
    this.mapData.getByType('point-of-interest').forEach((poi) => {
      if (poi.name) {
        if (['Bathrooms', 'Water Fountain'].includes(poi.name)) {
          this.addMapViewLabel(mapView, poi, poi.name, '#1d63dc');
        } else {
          this.addMapViewLabel(mapView, poi, poi.name);
        }
      }
    });
  }

  private initializeConnections(mapView: MapView) {
    this.mapData.getByType('connection').forEach((connection) => {
      let label;
      let labelColor;
      // Find the coordinates for the current floor.
      const coords = connection.coordinates.find(
        (coord) => coord.floorId === mapView.currentFloor.id
      );
      // Label the connection.
      if (connection.type == 'stairs') {
        label = 'Stairs';
        labelColor = '#228C22';
      } else if (connection.type === 'elevator') {
        label = 'Elevator';
        labelColor = '#a000c8';
      }

      if (coords) {
        this.addMapViewLabel(mapView, coords, label, labelColor);
      }
    });
  }

  private addMapViewLabel(
    mapView: MapView,
    mappedInObject: any,
    label: string,
    labelColor: string = '#000000'
  ): void {
    mapView.Labels.add(mappedInObject, label, {
      interactive: true,
      appearance: {
        marker: {
          foregroundColor: {
            active: labelColor
          }
        },
        text: {
          foregroundColor: labelColor
        }
      }
    });
  }

  async build(): Promise<MapView> {
    const mapView = await this._show3dMap(this.container, this.mapData);

    // Initializations
    this.initializeSpaces(mapView);
    this.initializePointsOfInterests(mapView);
    this.initializeConnections(mapView);

    mapView.updateState(DOORS.Exterior, {
      visible: true,
      color: 'black',
      opacity: 0.6
    });
    mapView.updateState(DOORS.Interior, {
      visible: true,
      color: 'lightgrey',
      opacity: 0.3
    });

    return mapView;
  }
}

import { BehaviorSubject, firstValueFrom, Observable } from "rxjs";
import { Location } from "../interfaces/location.interface";

/**
 * Abstract service for handling navigation directions.
 *
 * This class manages start and destination points using observables and provides methods
 * to set, retrieve, and clear these points. It serves as the base class for implementing
 * specific navigation rendering logic.
 *
 * @template T - A type extending Location, representing the type of location used for navigation.
 */
export abstract class DirectionsService<T extends Location> {
  private startPointSubject = new BehaviorSubject<T | null>(null);
  private destinationPointSubject = new BehaviorSubject<T | null>(null);
  private travelModeSubject = new BehaviorSubject<string | null>(null);
  
  /**
   * Sets the starting point for navigation.
   *
   * @param startPoint - The location to be set as the starting point.
   * @returns The provided starting point.
   */
  public setStartPoint(startPoint: T): T {
    this.startPointSubject.next(startPoint);
    return startPoint;
  }

  /**
   * Returns an observable that emits updates of the starting point.
   *
   * @returns An Observable emitting the current starting point or null.
   */
  public getStartPoint$(): Observable<T | null> {
    return this.startPointSubject.asObservable();
  }

  /**
   * Retrieves the current starting point as a Promise.
   *
   * @returns A Promise resolving to the current starting point or null.
   */
  public async getStartPoint(): Promise<T | null> {
    return await firstValueFrom(this.getStartPoint$());
  }

  /**
   * Sets the destination point for navigation.
   *
   * @param destinationPoint - The location to be set as the destination point.
   * @returns The provided destination point.
   */
  public setDestinationPoint(destinationPoint: T): T {
    this.destinationPointSubject.next(destinationPoint);
    return destinationPoint;
  }

  /**
   * Returns an observable that emits updates of the destination point.
   *
   * @returns An Observable emitting the current destination point or null.
   */
  public getDestinationPoint$(): Observable<T | null> {
    return this.destinationPointSubject.asObservable();
  }

  /**
   * Retrieves the current destination point as a Promise.
   *
   * @returns A Promise resolving to the current destination point or null.
   */
  public async getDestinationPoint(): Promise<T | null> {
    return await firstValueFrom(this.getDestinationPoint$());
  }

  /**
   * Returns an observable that emits updates of the current travel mode.
   *
   * The travel mode determines the mode of transportation (e.g., driving, walking, bicycling).
   *
   * @returns An Observable emitting the current travel mode or null.
   */
  public getTravelMode$(): Observable<string | null>  {
    return this.travelModeSubject.asObservable();
  }

  /**
   * Retrieves the current travel mode as a Promise.
   *
   * This method returns the travel mode, such as "driving", "walking", etc., 
   * or null if no mode has been set.
   *
   * @returns A Promise resolving to the current travel mode or null.
   */
  public async getTravelMode(): Promise<string | null>  {
    return await firstValueFrom(this.getTravelMode$());
  }

  /**
   * Sets the current travel mode for navigation.
   *
   * This method allows the user to specify the mode of transportation (e.g., 
   * "driving", "walking", "bicycling") for the navigation directions.
   *
   * @param mode - The mode of transportation to be set.
   * @returns The provided travel mode.
   */
  public setTravelMode(mode: string): string {
    this.travelModeSubject.next(mode);
    return mode;
  }

  /**
   * Clears the current starting point by setting it to null.
   */
  public clearStartPoint(): void {
    this.setStartPoint(null);
  }

  /**
   * Clears the current destination point by setting it to null.
   */
  public clearDestinationPoint(): void {
    this.setDestinationPoint(null);
  }

  /**
   * Renders navigation directions.
   *
   * Subclasses must implement this method to provide specific logic for rendering
   * the navigation directions based on the current start and destination points.
   */
  abstract renderNavigation(): void;

  /**
   * Clears the current navigation directions.
   *
   * This method is intended to reset any active navigation and remove any
   * rendered directions. It is abstract and must be implemented in subclasses
   * to provide specific logic for clearing the navigation in the context of 
   * the service being used (e.g., clearing directions on the map or in UI).
   */
  abstract clearNavigation(): void;
}

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
  abstract renderDirections(): void;
}

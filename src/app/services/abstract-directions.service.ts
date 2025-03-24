import { BehaviorSubject, firstValueFrom, Observable } from "rxjs";
import { Location } from "../interfaces/location.interface";

export abstract class DirectionsService<T extends Location> {
  private startPointSubject = new BehaviorSubject<T | null>(null);
  private destinationPointSubject = new BehaviorSubject<T | null>(null);
  
  public setStartPoint(startPoint: T): T {
    this.startPointSubject.next(startPoint);
    return startPoint;
  }

  public getStartPoint$(): Observable<T | null> {
    return this.startPointSubject.asObservable();
  }

  public async getStartPoint(): Promise<T | null> {
    return await firstValueFrom(this.getStartPoint$());
  }

  public setDestinationPoint(destinationPoint: T): T {
    this.destinationPointSubject.next(destinationPoint);
    return destinationPoint;
  }

  public getDestinationPoint$(): Observable<T | null> {
    return this.destinationPointSubject.asObservable();
  }

  public async getDestinationPoint(): Promise<T | null> {
    return await firstValueFrom(this.getDestinationPoint$());
  }

  public clearStartPoint(): void {
    this.setStartPoint(null);
  }

  public clearDestinationPoint(): void {
    this.setDestinationPoint(null);
  }

  abstract renderDirections(): void;
}

import { Injectable } from '@angular/core';
import data from 'src/assets/shuttle-data.json';

@Injectable({
  providedIn: 'root'
})
export class ShuttleDataService {

  public getNextBus(campus: string): string {
    const date = new Date();
    const dayOfWeek = date.toLocaleDateString(`en-us`, { weekday: 'long' });

    if (!data.schedule[dayOfWeek]) return null;

    const currentTime = date.getHours() * 60 + date.getMinutes();
    const departures = data.schedule[dayOfWeek][campus];
    const nextDeparture = departures.find((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });

    return nextDeparture || null;
  }
}

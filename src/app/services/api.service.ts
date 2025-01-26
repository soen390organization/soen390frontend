import { Injectable } from "@angular/core";
import { db as database } from '../../firebase.config';
import { ref, set, get, update, push, remove } from 'firebase/database';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private async generateUniqueId(route: string): Promise<string> {
    let uniqueId: string | null = null;
    let isUnique = false;

    while (!isUnique) {
      uniqueId = push(ref(database)).key;

      if (!uniqueId) {
        throw new Error("Failed to generate a unique ID.");
      }

      const idRef = ref(database, `${route}/${uniqueId}`);
      const snapshot = await get(idRef);
      isUnique = !snapshot.exists();
    }

    return <string>uniqueId;
  }

  public async updateOrCreate(route: string, data: any) {
    try {
      // Generate a unique ID if data.id is null or undefined
      if (!data.id) {
        data.id = await this.generateUniqueId(route);
      }
  
      const { id, ...dataWithoutId } = data;
      const dataRef = ref(database, `${route}/${id}`);
      const snapshot = await get(dataRef);
  
      if (snapshot.exists()) {
        // Update if the data already exists
        await update(dataRef, dataWithoutId);
        console.log(`Data updated at ${route}/${id}`);
      } else {
        // Create if the data does not exist
        await set(dataRef, dataWithoutId);
        console.log(`Data created at ${route}/${id}`);
      }
    } catch (error) {
      console.error(`Failed to update or create data at ${route}/${data.id}:`, error);
    }
  }

  public async get(route: string, id: string): Promise<any> {
    try {
      const dataRef = ref(database, `${route}/${id}`);
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        console.log(`Data retrieved from ${route}/${id}:`, snapshot.val());
        return snapshot.val();
      } else {
        console.warn(`No data found at ${route}/${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to retrieve data from ${route}/${id}:`, error);
      return null;
    }
  }

  public async delete(route: string, id: string): Promise<void> {
    try {
      const dataRef = ref(database, `${route}/${id}`);
      await remove(dataRef);
      console.log(`Data deleted at ${route}/${id}`);
    } catch (error) {
      console.error(`Failed to delete data at ${route}/${id}:`, error);
    }
  }
}
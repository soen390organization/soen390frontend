export const environment = {
  production: true,
  mappedin: {
    mapId: 'YOUR_MAPID',
    key: 'YOUR_KEY',
    secret: 'YOUR_SECRET'
  },
} as EnvironmentType;

export type EnvironmentType = {
  production: boolean;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  mappedin: {
    mapId: string;
    key: string;
    secret: string;
  };
};
declare module 'react-native-exif' {
    export function getExif(uri: string, callback: (error: any, data: any) => void): void;
  }
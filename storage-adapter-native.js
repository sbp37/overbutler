import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { createNativeStorageAdapter, createWebStorageAdapter } from "./storage-adapter-core.js";

export const Storage = Capacitor.isNativePlatform()
  ? createNativeStorageAdapter(Preferences)
  : createWebStorageAdapter();

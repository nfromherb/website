/// <reference types="vite/client" />
import { DashboardApi } from '../../preload'

declare global {
  interface Window {
    api: DashboardApi
  }
}

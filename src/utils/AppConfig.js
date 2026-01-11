/**
 * AppConfig - Zentrale Klasse für Metadaten und System-Konstanten.
 * Ermöglicht den Zugriff auf Versionierung und Build-Infos von überall.
 */
export default class AppConfig {
  
  // Die App-Version (Build-String)
  static getAppVersion() {
    return typeof __APP_VERSION__ !== 'undefined' 
      ? __APP_VERSION__ 
      : 'N/A';
  }

  // Das Build-Datum
  static getBuildDate() {
    return typeof __BUILD_DATE__ !== 'undefined' 
      ? __BUILD_DATE__ 
      : 'N/A';
  }

  // Die Version der Data Engine (Szenarien)
  static getEngineVersion(scenariosData) {
    return scenariosData?.version || "N/A";
  }

  // Optional: Eine Hilfsmethode, die den fertigen Info-Block für das UI zurückgibt
  static getFullVersionString(scenariosData) {
    return `Engine: v${this.getEngineVersion(scenariosData)} | Build: ${this.getAppVersion()}`;
  }
}
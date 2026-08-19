# Changelog

## [1.3.1] - 2026-08-19

### Changed

- Se optimiza el formato de enlaces compartidos para usar un hash más corto y legible.
- Los IDs de perfil se guardan al inicio del enlace para restaurar usuarios rápidamente.
- Las listas se serializan con un esquema compacto por grupo y cantidad.
- Se mantiene compatibilidad con los formatos previos para no romper enlaces ya compartidos.

## [1.3.0] - 2026-08-11

### Added

- Enlaces compartibles para abrir y recalcular un intercambio entre dos colecciones.
- Visualización del nombre del perfil al importar desde IntercambiaLáminas.
- Restauración automática de las listas al abrir un enlace compartido.
- Codificación compacta de las listas en los enlaces compartidos.

## [1.2.0] - 2026-08-11

### Added

- Página independiente de calculadora para sumar y restar colecciones.
- Importación de una colección base desde un perfil de IntercambiaLáminas.
- Conversión de colecciones al formato de exportación de Figuritas App.
- Conversión de exportaciones de Figuritas App a listas de faltantes y repetidas compatibles con IntercambiaLáminas.

## [1.1.0] - 2026-08-11

### Added

- Importación de láminas faltantes y repetidas desde el ID o enlace de perfil de IntercambiaLáminas, sin salir del modo manual.
- Avisos en los resultados cuando una persona no registra láminas faltantes o no tiene repetidas con cantidad 2 o más.
- Uso de singular en los resultados cuando hay exactamente una lámina o repetida doble.

### Fixed

- Se corrige el botón de importación de la persona B, que impedía inicializar la aplicación.
- Se evita importar antes de que el catálogo de láminas termine de cargar.

## [1.0.0] - 2026-07-28

### Added

- Importación manual
- Importación desde Figuritas App
- Importación desde IntercambiaLáminas
- Cálculo de intercambios directos
- Se muestran cantidades de cada lámina para intercambios directos (2 o más, se asume 1 mínimo)
- Detección de repetidas dobles
- Se muestran cantidades de cada lámina repetida "doble" (3 o más, se asume 2 mínimo)

### Changed

- Nueva arquitectura basada en Album, AlbumState y TradePlanner.

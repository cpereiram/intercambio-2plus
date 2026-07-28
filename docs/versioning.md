# Política de Versionado

Este proyecto utiliza Semantic Versioning (SemVer).

Formato:

MAJOR.MINOR.PATCH

Ejemplos:

1.0.0

- Primera versión estable.

1.0.1

- Corrección de errores.
- No agrega funcionalidades nuevas.

1.1.0

- Nuevas funcionalidades compatibles.
- Mejoras del algoritmo.
- Nuevos formatos de importación.

2.0.0

- Cambios incompatibles con versiones anteriores.
- Reestructuración importante de la arquitectura.

## Flujo de trabajo

Las nuevas funcionalidades se desarrollan en ramas independientes creadas desde `main`.

Una vez finalizadas:

- Se realiza merge a `main`.
- Se actualiza `CHANGELOG.md`.
- Se incrementa la versión.
- Opcionalmente se crea un tag Git (`vX.Y.Z`).

## Objetivo

Que cada versión publicada pueda identificarse y recuperarse fácilmente en el futuro.
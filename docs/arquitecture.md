# Arquitectura

A partir de la versión **1.0.0**, Intercambio 2+ adopta una arquitectura basada en un modelo de dominio simple, desacoplado de la interfaz gráfica y preparado para soportar nuevos algoritmos de intercambio.

El objetivo principal es separar claramente:

- El **modelo del álbum**.
- El **estado de cada coleccionista**.
- El **algoritmo de cálculo**.
- La **interfaz de usuario**.

De esta forma, cada componente tiene una única responsabilidad.

---

# Estructura del proyecto

```
model/
├── album.js
├── albumState.js
└── tradePlanner.js

app.js
index.html
mundial-2026.json
```

## Responsabilidades

| Archivo | Responsabilidad |
|----------|-----------------|
| `album.js` | Representa el universo completo del álbum. |
| `albumState.js` | Representa el estado de un coleccionista. |
| `tradePlanner.js` | Contiene el algoritmo de cálculo de intercambios. |
| `app.js` | Interfaz de usuario, parsers y coordinación entre modelos. |

---

# Modelo del dominio

La aplicación se basa en tres conceptos principales.

## Album

Representa un álbum completo.

Es una estructura inmutable que conoce:

- Todas las láminas existentes.
- El orden oficial del álbum.
- La relación entre código e índice.

Ejemplo:

```
Índice    Código

0         FWC0
1         FWC1
2         ARG1
3         ARG2
...
```

Internamente mantiene dos estructuras:

```
stickers[]

Map(código → índice)
```

Esto permite:

- búsquedas rápidas por código;
- mantener siempre el orden oficial del álbum.

---

## AlbumState

Representa el estado de un coleccionista sobre un álbum.

Cada persona almacena únicamente dos conjuntos de datos:

```
missing[]
offer[]
```

Ambos son vectores (`Uint8Array`) cuya longitud coincide exactamente con el número de láminas del álbum.

Cada posición representa una lámina.

Ejemplo:

```
Índice   Código   Missing   Offer

0        FWC0        0         0
1        FWC1        1         0
2        ARG1        0         3
3        ARG2        2         0
```

No se almacenan otros estados.

---

## Estados derivados

Información como:

- láminas pegadas;
- repetidas dobles;
- láminas disponibles para intercambio;

no se almacena.

Se calcula cuando es necesario mediante métodos del modelo.

Por ejemplo:

```
stuck = !missing && !offer
```

Esto evita inconsistencias y mantiene un único origen de verdad.

---

## TradePlanner

Es el motor de la aplicación.

Su única responsabilidad es calcular posibles intercambios entre dos estados.

No conoce:

- HTML;
- formularios;
- APIs externas;
- formatos de entrada.

Únicamente trabaja con:

```
AlbumState A
AlbumState B
```

y devuelve un resultado.

---

# Flujo de datos

```
Usuario

      │

      ▼

Parser

      │

      ▼

AlbumState A
AlbumState B

      │

      ▼

TradePlanner

      │

      ▼

Resultado

      │

      ▼

Interfaz
```

La interfaz nunca implementa reglas de negocio.

Toda la lógica pertenece al modelo.

---

# ¿Por qué utilizar índices?

Aunque las láminas poseen códigos como:

```
ARG17
BRA9
CC12-LAM
```

internamente el algoritmo trabaja únicamente con índices.

Ejemplo:

```
ARG17

↓

352
```

Esto ofrece varias ventajas:

- mantiene automáticamente el orden oficial del álbum;
- elimina ordenamientos adicionales;
- reduce búsquedas repetidas por código;
- simplifica las operaciones entre colecciones.

Los códigos únicamente se utilizan para:

- importar información;
- exportar resultados;
- mostrar datos al usuario.

---

# Filosofía del modelo

El universo de láminas es:

- conocido;
- pequeño (menos de 1000 elementos);
- inmutable;
- totalmente ordenado.

Por ello, resulta más sencillo y eficiente representar el estado mediante vectores indexados que mediante estructuras dinámicas como `Set` o `Map`.

Las operaciones del algoritmo consisten simplemente en recorrer dos vectores paralelos.

---

# Principios de diseño

La arquitectura sigue varios principios sencillos:

## Una responsabilidad por clase

Cada modelo resuelve un único problema.

- `Album` conoce el universo.
- `AlbumState` conoce el estado de una persona.
- `TradePlanner` conoce el algoritmo.

---

## Estado mínimo

Solo se almacena la información indispensable.

Todo lo demás se calcula cuando es necesario.

---

## Separación entre dominio e interfaz

El modelo nunca conoce:

- HTML;
- botones;
- eventos;
- elementos del DOM.

Esto permite reutilizar el algoritmo desde cualquier interfaz futura.

---

## Preparado para crecer

Esta arquitectura facilita incorporar nuevas funcionalidades sin modificar la base del proyecto.

Ejemplos:

- nuevos formatos de importación;
- nuevos álbumes;
- algoritmos de optimización;
- intercambio entre múltiples personas;
- recomendaciones automáticas de cadenas de intercambio.

Todas estas mejoras pueden desarrollarse sobre el mismo modelo de dominio.

---

# Resumen

La arquitectura puede resumirse en tres piezas fundamentales:

```
                 Album
                    │
          ┌─────────┴─────────┐
          │                   │
     AlbumState A       AlbumState B
          │                   │
          └─────────┬─────────┘
                    │
             TradePlanner
                    │
              Resultado final
```

Este diseño busca priorizar la simplicidad, la claridad y la facilidad de mantenimiento antes que la complejidad innecesaria, permitiendo que la evolución futura del proyecto se centre en mejorar el algoritmo de intercambio y no en reorganizar la estructura del código.
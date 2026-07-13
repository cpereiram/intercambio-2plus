# Intercambio (2 plus) de Láminas Mundial 2026

Aplicación web para calcular intercambios de láminas entre dos personas de forma rápida, utilizando únicamente HTML, CSS y JavaScript.

La aplicación se ejecuta completamente en el navegador, sin necesidad de servidor ni base de datos, y puede y se ejecuta mediante **GitHub Pages**.

---

## Características

* Cálculo de intercambios directos entre dos personas.
* Identificación de láminas repetidas útiles para la otra persona.
* Validación automática de códigos contra el catálogo oficial.
* Soporte para cantidades mediante el formato `CODIGO(n)`.

Ejemplos válidos:

```
RSA3
RSA3(2)
ARG15(4), BRA8, USA12
```

---

## Tecnologías

* HTML5
* CSS3
* JavaScript (ES6)
* GitHub Pages

No utiliza frameworks ni dependencias externas.

---

## Estructura del proyecto

```
.
├── index.html          # Interfaz
├── style.css           # Estilos
├── app.js              # Lógica de la aplicación
├── mundial-2026.json   # Catálogo completo del álbum
└── README.md
```

---

## Funcionamiento

Para cada persona se ingresan:

* Láminas faltantes.
* Láminas repetidas o disponibles para intercambio.

La aplicación calcula:

* Láminas que A puede ofrecer a B, y viceversa.
* Láminas repetidas (dos o más copias) que podrían ser útiles para la otra persona.

Todo el procesamiento ocurre localmente en el navegador.

---

## Ejecución local

Clonar el repositorio:

```bash
git clone https://github.com/cpereiram/intercambio-2plus.git
```

Entrar al directorio:

```bash
cd intercambio-2plus
```

Servir la carpeta con cualquier servidor HTTP.

Con Python:

```bash
python -m http.server
```

Luego abrir:

```
http://localhost:8000
```

También puede utilizarse la extensión **Live Server** de Visual Studio Code.

También se puede abrir directamente el html en cualquier navegador, gracias a su ejecución no requiere nada externo.

---

## Publicación

El proyecto está publicado en línea mediante GitHub Pages.

```
https://cpereiram.github.io/intercambio-2plus/
```

---

## Próximas mejoras

* Guardado automático mediante LocalStorage.
* Cálculo automático mientras se escribe.
* Importación y exportación de listas.
* Admitir multiples formatos de listas.
* Aceptar 0 y FWC0 como iguales.
* Copiar resultados al portapapeles.
* Estadísticas del álbum.
* Comparación entre más de dos personas.
* Soporte para nuevos álbumes mediante JSON.
* Permitir ingresar ID de perfil de intercambialáminas.com.
* Mostrar la cantidad, tanto en el resultado de cambios directos, como de repetidas dobles.

---

## Origen del proyecto

Este proyecto nace de la necesidad de poder calcular de manera rapida los intercambios de repetidas entre dos personas, comenzando primero como  una aplicación de escritorio desarrollada  en Python (Tkinter),  migrando posteriormente toda la lógica a una aplicación web estática para facilitar su uso desde cualquier dispositivo.

El algoritmo de intercambio fue preservado durante la migración, adaptando únicamente la interfaz y la implementación al ecosistema JavaScript.

---

## Licencia

MIT

# Intercambio (2 plus) de Láminas Mundial 2026

Aplicación web para calcular intercambios de láminas entre dos personas de forma rápida, utilizando únicamente HTML, CSS y JavaScript.

La aplicación se ejecuta completamente en el navegador, sin necesidad de servidor ni base de datos, y puede y se ejecuta mediante **GitHub Pages**.

# Filosofía del proyecto

Intercambio 2 plus nace con una idea sencilla: ayudar a que cada intercambio no solo complete un álbum hoy, sino que también aumente las posibilidades de futuros intercambios. Por eso, además de los cambios directos, la aplicación identifica repetidas dobles que pueden ser útiles para construir nuevas oportunidades de intercambio.

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

---

## Publicación

El proyecto está publicado en línea mediante GitHub Pages.

https://cpereiram.github.io/intercambio-2plus/


---

## Próximas mejoras

* Guardado automático mediante LocalStorage.
* Cálculo automático mientras se escribe.
* Importación y exportación de listas.
* Estadísticas del álbum.
* Comparación entre más de dos personas.
* Soporte para nuevos álbumes mediante JSON.

---


## Licencia

MIT

## Autor

Cristóbal Pereira M.

Proyecto desarrollado para facilitar el intercambio de láminas del Mundial 2026.

GitHub:
https://github.com/cpereiram

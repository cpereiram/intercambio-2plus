# Intercambio (2 plus) de Láminas Mundial 2026

Aplicación web para calcular intercambios de láminas entre dos personas de forma rápida, utilizando HTML, CSS y JavaScript puro.

La aplicación funciona 100% en el navegador, sin servidor ni base de datos, y está publicada con **GitHub Pages**.

# Filosofía del proyecto

Intercambio 2 plus nace para ayudar a que cada intercambio no solo complete un álbum hoy, sino que también genere mejores oportunidades para futuros trueques. Además de calcular cambios directos, la app detecta repetidas útiles para la otra persona y ayuda a priorizar intercambios más valiosos.

---

## Características

* Cálculo de intercambios directos entre dos personas.
* Detección de láminas repetidas útiles para la otra persona.
* Validación automática de códigos contra el catálogo oficial.
* Importación desde perfiles de IntercambiaLáminas.
* Importación desde exportaciones de Figuritas App.
* Compartido de enlaces compactados con IDs de perfil y instantáneas de las colecciones.
* Compatibilidad con versiones previas de enlaces compartidos.

Ejemplos válidos de entrada:

```text
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

* Láminas que A puede ofrecer a B y viceversa.
* Láminas repetidas (dos o más copias) que pueden ser útiles para la otra persona.
* Resultados optimizados para priorizar intercambios concretos y útiles.

Todo el procesamiento ocurre localmente en el navegador.

---

## Enlaces compartidos

La versión actual incluye un formato compacto de enlace para enviar un intercambio exacto a otra persona o guardar una instantánea del cálculo.

Formato general:

```text
#share=3&p={ID1}.{ID2}%a&{buscaA}&{repA}%b&{buscaB}&{repB}
```

Donde:

* `p` son los IDs de perfil de IntercambiaLáminas.
* `%a` y `%b` representan las listas de A y B.
* `busca` y `rep` representan faltantes y repetidas respectivamente.
* El contenido se comprime por grupo y cantidad para ahorrar caracteres.

Ejemplo:

```text
#share=3&p=14061.14170%a&01.A2B3C3|04.ABC&01C%b&01.ABC2&01D
```

Este formato permite:

* recuperar los perfiles importados
* guardar una instantánea del intercambio calculado
* compartir mucho menos texto que una versión expandida

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

```text
http://localhost:8000
```

También puede utilizarse la extensión **Live Server** de Visual Studio Code.

---

## Publicación

El proyecto está publicado en línea mediante GitHub Pages.

https://cpereiram.github.io/intercambio-2plus/

---

## Versionado

La versión actual es **1.3.1**.

Se sigue la convención SemVer:

```text
MAJOR.MINOR.PATCH
```

---

## Próximas mejoras

* Guardado automático mediante LocalStorage.
* Cálculo automático mientras se escribe.
* Exportación de colecciones a formatos útiles.
* Estadísticas del álbum y progreso general.
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

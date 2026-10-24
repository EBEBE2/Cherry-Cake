# Cherry Cake

Panel interno para organizar pedidos de repostería, clientes, catálogo, insumos,
pagos y recordatorios de producción. Está pensado para uso de la repostera; los
clientes no realizan pedidos directamente.

## Estructura

- `frontend/index.html`: estructura de la interfaz.
- `frontend/styles.css`: estilos visuales y diseño adaptable.
- `frontend/app.js`: navegación, pantallas y comportamiento de demostración.
- `database/01_schema_database.sql`: esquema inicial para PostgreSQL.

## Abrir la interfaz

Abre `frontend/index.html` en un navegador moderno. No requiere instalación ni
servidor para revisar la maqueta.

La interfaz contiene navegación funcional y un formulario para crear pedidos,
pero usa datos en memoria de demostración: los cambios se pierden al recargar y
todavía no se conecta al esquema SQL ni almacena imágenes. El SQL es una pieza
independiente para que la capa de datos pueda implementarse o modificarse sin
mezclarla con el diseño visual.

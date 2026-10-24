-- Cherry Cake - esquema inicial PostgreSQL
-- Importe este archivo en una base de datos vacia.

CREATE TYPE unidad_base AS ENUM ('g', 'ml', 'pza');
CREATE TYPE estatus_pedido AS ENUM (
    'pendiente', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado'
);
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta', 'otro');
CREATE TYPE modo_recargo AS ENUM ('fijo', 'por_hora', 'por_dia', 'porcentaje');
CREATE TYPE estado_recordatorio AS ENUM ('programado', 'enviado', 'cancelado', 'fallido');

CREATE TABLE insumos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL UNIQUE,
    unidad_base unidad_base NOT NULL,
    costo_unitario NUMERIC(12, 6) NOT NULL CHECK (costo_unitario >= 0),
    ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE historial_precios_insumos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    insumo_id BIGINT NOT NULL REFERENCES insumos(id),
    cantidad_base_comprada NUMERIC(12, 3) NOT NULL CHECK (cantidad_base_comprada > 0),
    costo_total_compra NUMERIC(12, 2) NOT NULL CHECK (costo_total_compra >= 0),
    costo_por_unidad_base NUMERIC(12, 6) NOT NULL CHECK (costo_por_unidad_base >= 0),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    notas TEXT
);

CREATE TABLE categorias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO categorias (nombre) VALUES
    ('Pasteles'), ('Pays'), ('Roles'), ('Galletas'), ('Gelatinas'),
    ('Flanes'), ('Pan de muerto'), ('Rosca de Reyes');

CREATE TABLE productos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria_id BIGINT NOT NULL REFERENCES categorias(id),
    nombre VARCHAR(160) NOT NULL,
    descripcion TEXT,
    margen_ganancia NUMERIC(5, 4) NOT NULL DEFAULT 0.40
        CHECK (margen_ganancia >= 0 AND margen_ganancia < 1),
    precio_sugerido NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio_sugerido >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (categoria_id, nombre)
);

CREATE TABLE presentaciones_producto (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    nombre VARCHAR(100) NOT NULL,
    porciones INTEGER NOT NULL CHECK (porciones > 0),
    factor_receta NUMERIC(10, 4) NOT NULL DEFAULT 1 CHECK (factor_receta > 0),
    precio_sugerido NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio_sugerido >= 0),
    predeterminada BOOLEAN NOT NULL DEFAULT FALSE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (producto_id, nombre),
    UNIQUE (producto_id, id)
);

CREATE TABLE recetas_insumos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    insumo_id BIGINT NOT NULL REFERENCES insumos(id),
    cantidad_necesaria NUMERIC(12, 3) NOT NULL CHECK (cantidad_necesaria > 0),
    UNIQUE (producto_id, insumo_id)
);

CREATE TABLE clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    telefono VARCHAR(40),
    notas TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pedidos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_entrega_acordada TIMESTAMPTZ NOT NULL,
    numero_personas INTEGER CHECK (numero_personas > 0),
    foto_referencia_url TEXT,
    estatus_pedido estatus_pedido NOT NULL DEFAULT 'pendiente',
    hora_recoleccion_real TIMESTAMPTZ,
    costo_produccion_total NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (costo_produccion_total >= 0),
    precio_venta_final NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (precio_venta_final >= 0),
    recargo_monto NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (recargo_monto >= 0),
    recargo_manual BOOLEAN NOT NULL DEFAULT FALSE,
    nota_recargo TEXT,
    notas TEXT,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE detalle_pedido_productos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id),
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    presentacion_id BIGINT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    tamano_sugerido VARCHAR(100),
    porciones_snapshot INTEGER CHECK (porciones_snapshot > 0),
    costo_unitario_snapshot NUMERIC(12, 2) NOT NULL CHECK (costo_unitario_snapshot >= 0),
    precio_unitario_snapshot NUMERIC(12, 2) NOT NULL CHECK (precio_unitario_snapshot >= 0),
    observaciones_personalizacion TEXT,
    FOREIGN KEY (producto_id, presentacion_id)
        REFERENCES presentaciones_producto (producto_id, id)
);

CREATE TABLE pagos_pedido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id),
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT now(),
    metodo metodo_pago NOT NULL,
    referencia VARCHAR(160),
    notas TEXT
);

CREATE TABLE configuracion_recargos (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    tolerancia_minutos INTEGER NOT NULL DEFAULT 0 CHECK (tolerancia_minutos >= 0),
    modo modo_recargo NOT NULL DEFAULT 'fijo',
    monto NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
    monto_maximo NUMERIC(12, 2) CHECK (monto_maximo >= 0),
    requiere_confirmacion BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE recordatorios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id),
    programado_para TIMESTAMPTZ NOT NULL,
    estado estado_recordatorio NOT NULL DEFAULT 'programado',
    enviado_en TIMESTAMPTZ,
    tipo VARCHAR(40) NOT NULL DEFAULT 'preparacion',
    mensaje TEXT,
    error TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pedido_id, programado_para, tipo)
);

CREATE INDEX idx_pedidos_fecha_entrega ON pedidos (fecha_entrega_acordada);
CREATE INDEX idx_pedidos_estatus_fecha
    ON pedidos (estatus_pedido, fecha_entrega_acordada);
CREATE INDEX idx_recetas_insumos_insumo ON recetas_insumos (insumo_id);
CREATE INDEX idx_recordatorios_pendientes ON recordatorios (programado_para)
    WHERE estado = 'programado';
CREATE INDEX idx_pagos_pedido ON pagos_pedido (pedido_id, fecha_pago);

CREATE VIEW estado_pago_pedidos AS
SELECT
    p.id AS pedido_id,
    p.precio_venta_final,
    COALESCE(SUM(pg.monto), 0) AS total_pagado,
    CASE
        WHEN COALESCE(SUM(pg.monto), 0) = 0 THEN 'Pendiente'
        WHEN COALESCE(SUM(pg.monto), 0) < p.precio_venta_final THEN 'Anticipo'
        ELSE 'Pagado'
    END AS estatus_pago,
    GREATEST(p.precio_venta_final - COALESCE(SUM(pg.monto), 0), 0) AS saldo
FROM pedidos p
LEFT JOIN pagos_pedido pg ON pg.pedido_id = p.id
GROUP BY p.id, p.precio_venta_final;

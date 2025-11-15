# Nuevas Validaciones en Endpoints de Venta

## Descripción General
Se han agregado validaciones avanzadas a los endpoints de creación y actualización de ventas para asegurar que:
1. Los usuarios autorizados tengan rol permitido en el comerciable
2. La cantidad de producto sea suficiente para la venta
3. El inventario de producto se maneje correctamente en transacciones

---

## 1. Validación de Roles Autorizados

### Descripción
Cuando se crea o actualiza una venta con `id_comerciable`, todos los usuarios en la lista `id_usuario` deben tener un rol incluido en el campo `roles_autorizados` del comerciable.

### Campos Relevantes
- **Comerciable.roles_autorizados**: String con roles separados por comas (ej: "Médico,Administrador")
- **Usuario.rol**: Campo que contiene el rol del usuario (ej: "Médico")

### Comportamiento
- Si `roles_autorizados` está vacío o es null, cualquier usuario puede vender el comerciable
- Si existe `roles_autorizados` y un usuario NO está incluido, retorna error con detalles:
  - Nombre del usuario que no está autorizado
  - Rol del usuario
  - Nombre del producto o servicio
  - Roles que SÍ están autorizados

### Ejemplo de Error
```json
{
  "message": "Errores en autorización de roles",
  "errors": [
    "Usuario \"juan_medico\" con rol \"Recepcionista\" no está autorizado a vender producto \"Antibiótico X\" (roles autorizados: Médico, Administrador)"
  ]
}
```

### Endpoints Afectados
- `POST /venta/create`
- `PUT /venta/update/{id}`
- `PUT /venta/{id}/usuarios`

---

## 2. Validación de Cantidad de Producto

### Descripción
Si el comerciable está asociado a un Producto, la cantidad de la venta no puede exceder la cantidad disponible del producto.

### Comportamiento
1. **Al crear venta**: Valida que `cantidad_venta <= cantidad_producto_disponible`
2. **Al actualizar venta**: 
   - Si cambia la cantidad: ajusta el inventario según la diferencia
   - Si cambia el comerciable a otro producto: restituye el anterior y descuenta el nuevo
3. **Al actualizar solo usuarios**: No afecta cantidad

### Restar Cantidad en Transacción
Cuando se crea una venta exitosamente con producto:
1. Se crea el registro de venta
2. Se descuenta la cantidad del producto: `Producto.cantidad -= cantidad_venta`
3. Se asocian los usuarios
4. Se confirma la transacción

Si cualquier paso falla, se revierte TODO (rollback).

### Ejemplo de Error - Cantidad Insuficiente
```json
{
  "message": "No hay cantidad suficiente del producto \"Antibiótico X\". Disponible: 5, Solicitado: 10"
}
```

### Endpoints Afectados
- `POST /venta/create`
- `PUT /venta/update/{id}`

---

## 3. Casos de Uso y Ejemplos

### Caso 1: Crear Venta con Producto y Validar Roles

#### Datos Previos
```
Comerciable (id=1):
  - roles_autorizados: "Médico,Administrador"
  - Producto:
    - nombre: "Antibiótico X"
    - cantidad: 50

Usuario (id=5):
  - nombre_usuario: "juan_medico"
  - rol: "Médico"

Usuario (id=6):
  - nombre_usuario: "carlos_recepc"
  - rol: "Recepcionista"
```

#### Solicitud EXITOSA (roles válidos)
```bash
curl -X POST 'http://localhost:4000/venta/create' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "precio_original_comerciable_cup": 100,
    "precio_original_comerciable_usd": 4,
    "cantidad": 10,
    "precio_cobrado_cup": 100,
    "forma_pago": "Efectivo",
    "id_comerciable": 1,
    "id_usuario": [5]
  }'
```

**Resultado**:
- ✅ Venta creada
- ✅ Producto cantidad reducida: 50 - 10 = 40

#### Solicitud FALLIDA (roles inválidos)
```bash
curl -X POST 'http://localhost:4000/venta/create' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "precio_original_comerciable_cup": 100,
    "precio_original_comerciable_usd": 4,
    "cantidad": 10,
    "precio_cobrado_cup": 100,
    "forma_pago": "Efectivo",
    "id_comerciable": 1,
    "id_usuario": [6]
  }'
```

**Respuesta (400)**:
```json
{
  "message": "Errores en autorización de roles",
  "errors": [
    "Usuario \"carlos_recepc\" con rol \"Recepcionista\" no está autorizado a vender producto \"Antibiótico X\" (roles autorizados: Médico, Administrador)"
  ]
}
```

---

### Caso 2: Validar Cantidad Insuficiente

#### Datos Previos
```
Comerciable (id=2):
  - Producto:
    - nombre: "Vacuna Y"
    - cantidad: 5
```

#### Solicitud FALLIDA (cantidad insuficiente)
```bash
curl -X POST 'http://localhost:4000/venta/create' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "precio_original_comerciable_cup": 200,
    "precio_original_comerciable_usd": 8,
    "cantidad": 10,
    "precio_cobrado_cup": 200,
    "forma_pago": "Transferencia",
    "id_comerciable": 2,
    "id_usuario": [5]
  }'
```

**Respuesta (400)**:
```json
{
  "message": "No hay cantidad suficiente del producto \"Vacuna Y\". Disponible: 5, Solicitado: 10"
}
```

---

### Caso 3: Actualizar Cantidad de Venta (Ajuste de Inventario)

#### Datos Previos
```
Venta (id=10):
  - cantidad: 10
  - id_comerciable: 2 (Producto "Vacuna Y")
  
Producto:
  - cantidad: 40 (después de la venta anterior)
```

#### Solicitud: Aumentar cantidad a 15
```bash
curl -X PUT 'http://localhost:4000/venta/update/10' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "cantidad": 15
  }'
```

**Resultado**:
- ✅ Venta cantidad actualizada: 15
- ✅ Producto cantidad ajustada: 40 - (15 - 10) = 35

#### Solicitud: Disminuir cantidad a 5
```bash
curl -X PUT 'http://localhost:4000/venta/update/10' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "cantidad": 5
  }'
```

**Resultado**:
- ✅ Venta cantidad actualizada: 5
- ✅ Producto cantidad restaurada: 35 + (10 - 5) = 40

---

### Caso 4: Cambiar Comerciable en Venta (Cambiar Producto)

#### Datos Previos
```
Venta (id=10):
  - cantidad: 5
  - id_comerciable: 2 (Producto "Vacuna Y")
  
Comerciable 1 (Producto "Antibiótico X"):
  - cantidad: 40

Comerciable 2 (Producto "Vacuna Y"):
  - cantidad: 40
```

#### Solicitud: Cambiar a Comerciable 1
```bash
curl -X PUT 'http://localhost:4000/venta/update/10' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "id_comerciable": 1
  }'
```

**Resultado**:
- ✅ Venta actualizada: id_comerciable = 1
- ✅ Vacuna Y cantidad restituida: 40 + 5 = 45
- ✅ Antibiótico X cantidad descontada: 40 - 5 = 35

---

### Caso 5: Actualizar Usuarios con Validación de Roles

#### Datos Previos
```
Venta (id=10):
  - id_comerciable: 1 (Producto "Antibiótico X")
  - roles_autorizados: "Médico,Administrador"

Usuario (id=5): rol = "Médico"
Usuario (id=6): rol = "Recepcionista"
Usuario (id=7): rol = "Administrador"
```

#### Solicitud FALLIDA (usuario no autorizado)
```bash
curl -X PUT 'http://localhost:4000/venta/10/usuarios' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "usuarios": [6]
  }'
```

**Respuesta (400)**:
```json
{
  "message": "Errores en autorización de roles",
  "errors": [
    "Usuario \"carlos_recepc\" con rol \"Recepcionista\" no está autorizado a vender producto \"Antibiótico X\" (roles autorizados: Médico, Administrador)"
  ]
}
```

#### Solicitud EXITOSA (usuarios autorizados)
```bash
curl -X PUT 'http://localhost:4000/venta/10/usuarios' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "usuarios": [5, 7]
  }'
```

**Resultado**:
- ✅ Usuarios actualizado: [5, 7]
- ✅ Ambos usuarios tienen roles válidos

---

## 4. Flujo de Transacción Garantizado

### En Creación de Venta con Producto

```
1. BEGIN TRANSACTION
2. Validar todos los datos (FK, roles, cantidad)
3. Crear registro de venta
4. Si es producto: Actualizar cantidad = cantidad - venta_cantidad
5. Crear asociaciones VentaUsuario
6. COMMIT
   - Si cualquier paso falla: ROLLBACK AUTOMÁTICO
```

### En Actualización de Venta

```
1. BEGIN TRANSACTION
2. Obtener venta actual
3. Validar datos nuevos
4. Si cambio de comerciable:
   - Restituir cantidad en comerciable anterior
5. Si cambio de cantidad:
   - Ajustar cantidad en comerciable actual
6. Actualizar venta
7. Si hay nuevo id_usuario:
   - Eliminar asociaciones anteriores
   - Crear nuevas asociaciones
8. COMMIT
   - Si cualquier paso falla: ROLLBACK AUTOMÁTICO
```

---

## 5. Campos de Ejemplo en Base de Datos

### Comerciable
```sql
{
  id_comerciable: 1,
  precio_cup: 100.00,
  precio_usd: 4.00,
  roles_autorizados: "Médico,Administrador"  -- Nuevo campo con roles
}
```

### Producto
```sql
{
  id_comerciable: 1,
  nombre: "Antibiótico X",
  cantidad: 50  -- Se decrementa con cada venta
}
```

### Usuario
```sql
{
  id_usuario: 5,
  nombre_usuario: "juan_medico",
  rol: "Médico"
}
```

### Venta
```sql
{
  id_venta: 10,
  fecha: 2025-11-15,
  cantidad: 5,
  precio_cobrado_cup: 100.00,
  id_comerciable: 1,
  ...
}
```

---

## 6. Resumen de Cambios en el Código

### Archivo: `services/ventaService.js`
- ✅ Función: `validateUsuariosRolesAutorizados()` - Valida roles
- ✅ Función: `validateProductoQuantity()` - Valida cantidad disponible
- ✅ Función: `createVenta()` - Incluye lógica de restar cantidad
- ✅ Función: `updateVenta()` - Maneja cambios de comerciable y cantidad
- ✅ Función: `updateVentaUsuarios()` - Valida roles en nuevo endpoint

### Archivo: `routes/ventaRoutes.js`
- ✅ Documentación Swagger actualizada para POST /venta/create
- ✅ Documentación Swagger actualizada para PUT /venta/update/{id}
- ✅ Documentación Swagger actualizada para PUT /venta/{id}/usuarios

### Archivo: `controllers/ventaController.js`
- No hay cambios (usa funciones del servicio)

---

## 7. Rollback Automático

Todas las operaciones usan transacciones de Sequelize. Si cualquier validación falla después de BEGIN TRANSACTION:

```javascript
try {
  await t.commit();  // Si todo OK
} catch (error) {
  await t.rollback();  // Si hay error
  throw error;
}
```

**Esto garantiza que:**
- Si falla la creación de venta → No se descuenta el producto
- Si falla la validación de rol en transacción → No se cambian usuarios
- Si falla la actualización del inventario → No se actualiza la venta

---

## Preguntas Frecuentes

### P: ¿Qué pasa si no especifico roles_autorizados en Comerciable?
**R**: Si está vacío o null, cualquier usuario puede vender ese comerciable.

### P: ¿Se puede tener una venta sin comerciable?
**R**: Sí, en ese caso no hay validación de cantidad ni roles. Es una venta "directa".

### P: ¿Se puede crear venta con comerciable que es un Servicio?
**R**: Sí, pero no hay validación de cantidad (los servicios no tienen inventario).

### P: ¿Qué pasa si actualizo solo id_usuario en una venta con producto?
**R**: Se validan roles, pero NO se afecta la cantidad del producto.

### P: ¿Puedo tener múltiples usuarios en una venta?
**R**: Sí, y TODOS deben cumplir las validaciones (estar autorizados si hay comerciable).

### P: ¿Se puede bajar cantidad de un producto a negativo?
**R**: No, si intenta bajar más de lo disponible, retorna error.


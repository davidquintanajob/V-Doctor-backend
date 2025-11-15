# Resumen de Implementación - Validaciones Avanzadas en Venta

## 🎯 Objetivo Logrado
Agregar validaciones avanzadas a los endpoints de creación y actualización de ventas para:
- ✅ Verificar autorización de roles de usuarios por comerciable
- ✅ Validar cantidad disponible de productos
- ✅ Manejar inventario transaccionalmente

---

## 📋 Cambios Implementados

### 1️⃣ **Services** (`services/ventaService.js`)

#### Nuevas Funciones

```javascript
// ✅ Valida que usuarios tengan rol autorizado
validateUsuariosRolesAutorizados(id_comerciable, usuarios)
  → Retorna array de errores si algún usuario no está autorizado
  → Incluye nombre del usuario, su rol actual, y roles autorizados
  → Se aplica en: createVenta, updateVenta, updateVentaUsuarios

// ✅ Valida cantidad de producto disponible
validateProductoQuantity(id_comerciable, cantidadVenta)
  → Retorna { valid: true } o { valid: false, error: string }
  → Se aplica en: createVenta, updateVenta
```

#### Funciones Modificadas

```javascript
// ✅ createVenta(ventaData)
// Cambios:
//   1. Llama validateUsuariosRolesAutorizados()
//   2. Llama validateProductoQuantity()
//   3. Crea venta en transacción
//   4. Descuenta cantidad del producto (si es producto)
//   5. Crea asociaciones VentaUsuario
//   6. COMMIT o ROLLBACK automático

// ✅ updateVenta(id, ventaData)
// Cambios:
//   1. Valida roles de usuarios (actuales o nuevos)
//   2. Si cambia id_comerciable: restituye cantidad anterior
//   3. Si cambia cantidad: ajusta inventario
//   4. Maneja todo en transacción
//   5. COMMIT o ROLLBACK automático

// ✅ updateVentaUsuarios(id_venta, usuarios)
// Cambios:
//   1. Llama validateUsuariosRolesAutorizados()
//   2. Retorna error detallado si algún usuario no autorizado
//   3. Ejecuta en transacción
```

---

### 2️⃣ **Routes** (`routes/ventaRoutes.js`)

#### Documentación Swagger Actualizada

| Endpoint | Nuevas Validaciones Documentadas |
|----------|----------------------------------|
| `POST /venta/create` | • Roles autorizados<br>• Cantidad de producto<br>• Descuento automático de inventario |
| `PUT /venta/update/{id}` | • Cambio de comerciable<br>• Ajuste de cantidad<br>• Restitución de inventario |
| `PUT /venta/{id}/usuarios` | • Validación de roles autorizados |

**Ejemplo de descripción en Swagger:**
```yaml
id_comerciable:
  description: >
    Opcional, si se proporciona debe existir.
    Si es un producto, todos los usuarios deben estar autorizados 
    y cantidad debe ser <= cantidad disponible. 
    La cantidad se restará al crear la venta.
```

---

### 3️⃣ **Controllers** (`controllers/ventaController.js`)

**Sin cambios** - Los controllers usan las funciones de validación del servicio automáticamente.

---

## 🔄 Flujo de Transacción

### Crear Venta con Producto

```
┌─────────────────────────────────────┐
│   POST /venta/create                │
│   { id_comerciable, cantidad, ... } │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ BEGIN TRANSACTION  │
    └────────┬───────────┘
             │
    ┌────────▼──────────────────────────┐
    │ Validar ForeignKeys               │
    └────────┬──────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Validar Roles Autorizados                │
    │ (si existe id_comerciable)              │
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Validar Cantidad Disponible              │
    │ (si existe producto)                    │
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Crear Venta                             │
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Restar Cantidad de Producto             │
    │ (si existe producto)                    │
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Crear Asociaciones VentaUsuario          │
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ COMMIT ✅                                │
    │ Retornar Venta Creada                   │
    └──────────────────────────────────────────┘

    ❌ SI FALLA EN CUALQUIER PASO:
    └─▶ ROLLBACK automático
        └─▶ Se revierte TODO
```

---

## 📊 Validaciones por Endpoint

### POST /venta/create
```
✅ Campos obligatorios presentes
✅ Valores numéricos ≥ 0
✅ id_usuario array con ≥ 1 item
✅ Todos los ForeignKeys existen
✅ Todos los usuarios tienen rol autorizado (si id_comerciable)
✅ Cantidad ≤ cantidad_disponible (si id_comerciable es producto)
✅ forma_pago es válido (Efectivo|Transferencia)

📝 Si falla cualquiera:
   → Error 400 con detalles específicos
   → Transacción revierte
   → NO se crea nada
```

### PUT /venta/update/{id}
```
✅ Venta existe
✅ Valores numéricos ≥ 0 (si se proporciona)
✅ id_usuario array con ≥ 1 item (si se proporciona)
✅ Todos los ForeignKeys existen (si se proporcionan)
✅ Todos los usuarios autorizados (si se actualiza)
✅ Cantidad ≤ cantidad_disponible (si cambia)
✅ forma_pago es válido (si se proporciona)

📝 Lógica especial:
   → Si cambia id_comerciable:
     - Restituye cantidad en comerciable ANTERIOR
     - Descuenta cantidad en comerciable NUEVO
   → Si cambia cantidad:
     - Ajusta diferencia en comerciable actual
```

### PUT /venta/{id}/usuarios
```
✅ Venta existe
✅ usuarios array con ≥ 1 item
✅ Todos los usuarios existen
✅ Todos los usuarios autorizados (si venta tiene id_comerciable)

📝 Efecto:
   → Elimina TODAS las asociaciones anteriores
   → Crea nuevas asociaciones con usuarios proporcionados
```

---

## 🚀 Ejemplos de Uso

### ✅ Crear Venta EXITOSA
```bash
curl -X POST 'http://localhost:4000/venta/create' \
  -H 'Authorization: Bearer TOKEN' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "cantidad": 5,
    "precio_cobrado_cup": 100,
    "precio_original_comerciable_cup": 100,
    "precio_original_comerciable_usd": 4,
    "forma_pago": "Efectivo",
    "id_comerciable": 1,
    "id_usuario": [5]
  }'
```

**Resultado**: 
- ✅ Venta creada
- ✅ Producto cantidad: 50 → 45

---

### ❌ Crear Venta - Usuario NO Autorizado
```bash
curl -X POST 'http://localhost:4000/venta/create' \
  -d '{
    ...,
    "id_comerciable": 1,
    "id_usuario": [6]  # Usuario con rol "Recepcionista"
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

### ❌ Crear Venta - Cantidad Insuficiente
```bash
curl -X POST 'http://localhost:4000/venta/create' \
  -d '{
    ...,
    "cantidad": 100,  # Disponible: 5
    "id_comerciable": 2
  }'
```

**Respuesta (400)**:
```json
{
  "message": "No hay cantidad suficiente del producto \"Vacuna Y\". Disponible: 5, Solicitado: 100"
}
```

---

### ✅ Actualizar Usuarios - Reemplazar
```bash
curl -X PUT 'http://localhost:4000/venta/10/usuarios' \
  -d '{
    "usuarios": [5, 7]  # Médico, Administrador
  }'
```

**Resultado**:
- ✅ Usuarios reemplazados
- ✅ Ambos autorizados en comerciable

---

## 📁 Archivos Modificados

```
services/ventaService.js
  ├─ validateUsuariosRolesAutorizados() [NUEVA]
  ├─ validateProductoQuantity() [NUEVA]
  ├─ createVenta() [MODIFICADA]
  ├─ updateVenta() [MODIFICADA]
  └─ updateVentaUsuarios() [MODIFICADA]

routes/ventaRoutes.js
  ├─ POST /venta/create [SWAGGER ACTUALIZADO]
  ├─ PUT /venta/update/{id} [SWAGGER ACTUALIZADO]
  └─ PUT /venta/{id}/usuarios [SWAGGER ACTUALIZADO]

VENTA_VALIDACIONES.md [NUEVA]
  └─ Documentación completa con ejemplos
```

---

## 🧪 Testing Manual

### Requisitos para Testing
1. Bearer token válido en header `Authorization`
2. Base de datos con datos de prueba:
   - Comerciable(s) con producto(s)
   - Usuario(s) con diferentes roles
   - roles_autorizados configurados en comerciable

### Test 1: Crear venta con producto y validar roles
```bash
# Debería funcionar (rol autorizado)
POST /venta/create
{ id_comerciable: 1, id_usuario: [5], cantidad: 5 }
→ Status: 201 ✅

# Debería fallar (rol no autorizado)
POST /venta/create
{ id_comerciable: 1, id_usuario: [6], cantidad: 5 }
→ Status: 400 ❌
```

### Test 2: Validar cantidad de producto
```bash
# Debería fallar (cantidad insuficiente)
POST /venta/create
{ id_comerciable: 1, cantidad: 1000 }
→ Status: 400 ❌
→ Producto.cantidad sin cambios ✅

# Debería funcionar
POST /venta/create
{ id_comerciable: 1, cantidad: 5 }
→ Status: 201 ✅
→ Producto.cantidad -= 5 ✅
```

### Test 3: Actualizar usuarios en venta
```bash
# Debería funcionar
PUT /venta/10/usuarios
{ usuarios: [5, 7] }
→ Status: 200 ✅

# Debería fallar (usuario no autorizado)
PUT /venta/10/usuarios
{ usuarios: [6] }
→ Status: 400 ❌
```

---

## ✅ Checklist de Completitud

- [x] Función de validación de roles autorizados
- [x] Función de validación de cantidad de producto
- [x] Lógica de descuento en createVenta
- [x] Manejo de cambio de comerciable en updateVenta
- [x] Manejo de cambio de cantidad en updateVenta
- [x] Validación de roles en updateVentaUsuarios
- [x] Transacciones con rollback automático
- [x] Errores detallados y específicos
- [x] Documentación Swagger actualizada
- [x] Documentación MD con ejemplos
- [x] Sin errores de compilación/sintaxis

---

## 🔐 Seguridad

✅ Todas las operaciones están dentro de transacciones  
✅ Validación de roles antes de crear/actualizar  
✅ Validación de cantidad antes de crear/actualizar  
✅ Autenticación requerida en todos los endpoints  
✅ Errores específicos pero sin exponer datos sensibles  
✅ Rollback automático en caso de fallo

---

## 📝 Notas Importantes

1. **Transacciones**: Cada operación es ACID-compliant
2. **Rollback**: Si falla cualquier paso, NADA se persiste
3. **Roles Vacíos**: Si `roles_autorizados` es null/vacío, cualquiera puede vender
4. **Servicios**: Solo se valida cantidad para Productos (no para Servicios)
5. **Múltiples Usuarios**: Todos deben cumplir validaciones
6. **Cambio de Comerciable**: Restituye anterior, descuenta nuevo automáticamente


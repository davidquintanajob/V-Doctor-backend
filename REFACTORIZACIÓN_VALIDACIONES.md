# Refactorización de Validaciones - Venta

## Resumen del Cambio

Se ha refactorizado completamente el manejo de validaciones en los endpoints de venta. Ahora existe:

1. **Métodos de Validación** (`validateCreate`, `validateUpdate`, `validateDelete`, `validateUpdateUsuarios`)
   - Única responsabilidad: validar datos
   - Retornan: `{ valid: true }` o `{ valid: false, errors: [array de strings] }`
   - No ejecutan transacciones
   - Se pueden consumir por separado

2. **Métodos de Ejecución** (`createVenta`, `updateVenta`, `deleteVenta`, `updateVentaUsuarios`)
   - Única responsabilidad: ejecutar la lógica
   - No incluyen validaciones
   - Confían en que el controlador ya validó antes de llamarlos

3. **Controladores** mejorados
   - Primero validan con el método correspondiente
   - Si hay errores, retornan 400 ANTES de crear transacción
   - Si es válido, ejecutan la operación
   - Manejo de errores simple y consistente

4. **Nuevo Endpoint** de Pre-Validación
   - `POST /venta/validate` - Solo valida SIN crear nada
   - Útil para verificar si una venta se puede crear antes de intentarlo
   - Retorna mensaje detallado sobre errores

---

## Arquitectura

```
REQUEST (POST /venta/create con datos)
    ↓
CONTROLLER: createVenta()
    ↓
    ├─→ SERVICE: validateCreate(data)
    │       ├─ Validar campos obligatorios
    │       ├─ Validar tipos de dato
    │       ├─ Validar valores negativos
    │       ├─ Validar ForeignKeys
    │       ├─ Validar roles autorizados
    │       ├─ Validar cantidad de producto
    │       └─ Retorna: { valid, errors }
    │
    ├─ SI NO ES VÁLIDO:
    │   └─ Retornar 400 con errores
    │
    └─ SI ES VÁLIDO:
        ├─→ SERVICE: createVenta(data)
        │       ├─ BEGIN TRANSACTION
        │       ├─ Crear venta
        │       ├─ Restar cantidad de producto
        │       ├─ Crear asociaciones VentaUsuario
        │       ├─ COMMIT
        │       └─ Retorna: Venta creada
        │
        └─ Retornar 201 con venta creada
```

---

## Métodos de Validación

### `validateCreate(ventaData)`

**Descripción**: Valida que los datos para crear una venta sean correctos.

**Parámetros**:
```javascript
{
  fecha: string,
  precio_original_comerciable_cup: number,
  precio_original_comerciable_usd: number,
  cantidad: number,
  precio_cobrado_cup: number,
  forma_pago: string,
  id_usuario: [array of integers],
  costo_producto_cup?: number,
  nota?: string,
  id_cliente?: integer,
  id_consulta?: integer,
  id_servicio_complejo?: integer,
  id_comerciable?: integer
}
```

**Retorna**:
```javascript
{
  valid: true  // Si todos los validaciones pasan
}

O

{
  valid: false,
  errors: [
    "Faltan campos obligatorios: fecha, cantidad",
    "cantidad no puede ser negativo",
    "Usuario con id 999 no encontrado",
    "Usuario \"carlos_recepc\" con rol \"Recepcionista\" no está autorizado a vender...",
    "No hay cantidad suficiente del producto \"Vacuna Y\". Disponible: 5, Solicitado: 10"
  ]
}
```

**Validaciones que ejecuta**:
1. ✅ Campos obligatorios presentes
2. ✅ id_usuario es array con ≥ 1 item
3. ✅ Valores numéricos ≥ 0
4. ✅ forma_pago válido
5. ✅ Todos los ForeignKeys existen
6. ✅ Usuarios tienen rol autorizado (si id_comerciable)
7. ✅ Cantidad ≤ cantidad disponible del producto (si id_comerciable es producto)

---

### `validateUpdate(id, ventaData)`

**Descripción**: Valida que los datos para actualizar una venta sean correctos.

**Parámetros**:
```javascript
id: integer,
ventaData: {
  // Campos opcionales, solo los que se desean actualizar
  fecha?: string,
  cantidad?: number,
  precio_cobrado_cup?: number,
  id_comerciable?: integer,
  id_usuario?: [array of integers],
  // ... otros campos
}
```

**Retorna**:
```javascript
{
  valid: true
}

O

{
  valid: false,
  errors: [
    "Venta con id 999 no encontrada",
    "cantidad no puede ser negativo",
    "No hay cantidad suficiente...",
    "Usuario \"user\" no autorizado..."
  ]
}
```

**Validaciones que ejecuta**:
1. ✅ Venta existe
2. ✅ Valores numéricos ≥ 0 (si se proporcionan)
3. ✅ forma_pago válido (si se proporciona)
4. ✅ id_usuario es array con ≥ 1 item (si se proporciona)
5. ✅ Todos los ForeignKeys existen (si se proporcionan)
6. ✅ Usuarios tienen rol autorizado (con id_comerciable actual o nuevo)
7. ✅ Cantidad disponible suficiente

---

### `validateDelete(id)`

**Descripción**: Valida que una venta existe antes de eliminarla.

**Parámetros**:
```javascript
id: integer
```

**Retorna**:
```javascript
{
  valid: true
}

O

{
  valid: false,
  errors: ["Venta con id 999 no encontrada"]
}
```

---

### `validateUpdateUsuarios(id_venta, usuarios)`

**Descripción**: Valida que los usuarios se pueden asignar a una venta.

**Parámetros**:
```javascript
id_venta: integer,
usuarios: [array of integers]
```

**Retorna**:
```javascript
{
  valid: true
}

O

{
  valid: false,
  errors: [
    "usuarios debe ser un array con al menos 1 usuario",
    "Venta con id 10 no encontrada",
    "Usuario con id 999 no encontrado",
    "Usuario \"user\" no autorizado a vender..."
  ]
}
```

---

## Nuevos Endpoints

### `POST /venta/validate` - Validar antes de crear

**Descripción**: Valida si una venta se puede crear sin realmente crearla.

**Request**:
```bash
curl -X POST 'http://localhost:4000/venta/validate' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "precio_original_comerciable_cup": 100,
    "precio_original_comerciable_usd": 4,
    "cantidad": 5,
    "precio_cobrado_cup": 100,
    "forma_pago": "Efectivo",
    "id_comerciable": 1,
    "id_usuario": [5]
  }'
```

**Response (200 - Válida)**:
```json
{
  "message": "La venta puede ser creada sin problemas",
  "valid": true
}
```

**Response (400 - Inválida)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "Usuario \"user\" con rol \"Recepcionista\" no está autorizado a vender producto \"Producto X\"",
    "No hay cantidad suficiente del producto \"Producto X\". Disponible: 2, Solicitado: 5"
  ]
}
```

**Casos de Uso**:
- Validar datos antes de mostrar formulario
- Verificar errores sin causar efectos secundarios
- UI: mostrar al usuario qué está mal antes de intentar crear
- Testing: verificar validaciones sin crear datos

---

## Flujo de los Controladores

### `createVenta`

```javascript
const createVenta = async (req, res) => {
  try {
    // 1. VALIDAR PRIMERO
    const validation = await ventaService.validateCreate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // 2. SI ES VÁLIDO, CREAR
    const newVenta = await ventaService.createVenta(req.body);
    res.status(201).json(newVenta);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};
```

**Ventajas**:
- ✅ No crea transacción si hay errores de validación
- ✅ Errores detectados ANTES de tocar la BD
- ✅ Método `createVenta` solo ejecuta, no valida
- ✅ Controlador es simple y legible

---

### `updateVenta`

```javascript
const updateVenta = async (req, res) => {
  try {
    // 1. VALIDAR PRIMERO
    const validation = await ventaService.validateUpdate(req.params.id, req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // 2. SI ES VÁLIDO, ACTUALIZAR
    const updated = await ventaService.updateVenta(req.params.id, req.body);
    if (!updated) return res.status(404).json({ errors: ['Venta no encontrada'] });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};
```

---

### `updateVentaUsuarios`

```javascript
const updateVentaUsuarios = async (req, res) => {
  try {
    const { usuarios } = req.body;
    
    // 1. VALIDAR PRIMERO
    const validation = await ventaService.validateUpdateUsuarios(req.params.id, usuarios);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // 2. SI ES VÁLIDO, ACTUALIZAR
    const venta = await ventaService.updateVentaUsuarios(req.params.id, usuarios);
    res.json(venta);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};
```

---

## Mejoras de Arquitectura

### Antes (Mezclado)
```
createVenta()
├─ Validar campo X
├─ Validar FK
├─ Validar roles  ← Dentro de la transacción
├─ Validar cantidad
├─ BEGIN TRANSACTION
├─ Crear venta
└─ COMMIT
```

❌ Problemas:
- Validación dentro de transacción
- Si falla validación, se ha iniciado transacción innecesaria
- Lógica de validación + ejecución mezclada
- Difícil de testear por separado

### Después (Separado)
```
validateCreate() → { valid, errors }  ← ANTES de transacción

createVenta()                           ← SOLO ejecución
├─ BEGIN TRANSACTION
├─ Crear venta
├─ Actualizar inventario
└─ COMMIT
```

✅ Ventajas:
- Validación ANTES de cualquier operación
- Método de validación reutilizable
- Método de ejecución simple y eficiente
- Fácil de testear por separado
- UI puede usar validación sin crear datos

---

## Reutilización de Validaciones

```javascript
// En UI/Frontend: validar antes de enviar
const response = await fetch('/venta/validate', {
  method: 'POST',
  body: JSON.stringify(formData)
});

if (response.status === 200) {
  // Mostrar botón "Crear venta"
} else {
  // Mostrar errores en forma
}

// En Backend: reutilizar en múltiples lugares
const validation = ventaService.validateCreate(data);
const validation2 = ventaService.validateUpdate(id, data);
// ... etc
```

---

## Flujo Completo: Ejemplo

### Crear Venta Inválida (Usuario no autorizado)

**1. Request**:
```bash
POST /venta/create
{
  "fecha": "2025-11-15T10:00:00Z",
  "cantidad": 10,
  "precio_cobrado_cup": 100,
  "precio_original_comerciable_cup": 100,
  "precio_original_comerciable_usd": 4,
  "forma_pago": "Efectivo",
  "id_comerciable": 1,  # Roles autorizados: "Médico,Administrador"
  "id_usuario": [6]     # Usuario 6 tiene rol "Recepcionista"
}
```

**2. Controller ejecuta createVenta()**:
```javascript
const validation = await validateCreate(req.body);
// validateCreate retorna:
// {
//   valid: false,
//   errors: [
//     'Usuario "carlos_recepc" con rol "Recepcionista" 
//      no está autorizado a vender producto "Antibiótico X" 
//      (roles autorizados: Médico, Administrador)'
//   ]
// }
```

**3. Controller retorna error ANTES de crear**:
```javascript
if (!validation.valid) {
  return res.status(400).json({ errors: validation.errors });
}
// ← AQUÍ SE DETIENE, NO CONTINÚA
```

**4. Response (400)**:
```json
{
  "errors": [
    "Usuario \"carlos_recepc\" con rol \"Recepcionista\" no está autorizado a vender producto \"Antibiótico X\" (roles autorizados: Médico, Administrador)"
  ]
}
```

**Resultado**:
- ✅ BD no fue tocada
- ✅ Transacción nunca fue iniciada
- ✅ Usuario recibe error claro y específico

---

### Crear Venta Válida

**1. Request**:
```bash
POST /venta/create
{
  ...,
  "id_comerciable": 1,
  "id_usuario": [5]  # Usuario 5 tiene rol "Médico" ✅
}
```

**2. Validación pasa**:
```javascript
const validation = await validateCreate(req.body);
// { valid: true }
```

**3. Se ejecuta createVenta()**:
```javascript
if (validation.valid) {
  const newVenta = await createVenta(req.body);
  // BEGIN TRANSACTION
  // Crear venta
  // Restar cantidad de producto
  // Crear asociaciones VentaUsuario
  // COMMIT
  // Retorna venta creada
}
```

**4. Response (201)**:
```json
{
  "id_venta": 100,
  "fecha": "2025-11-15T10:00:00Z",
  "cantidad": 10,
  "usuario": [...],
  ...
}
```

---

## Testing

Los métodos se pueden testear independientemente:

```javascript
// Test validación sin efectos secundarios
describe('validateCreate', () => {
  it('rechaza valores negativos', async () => {
    const result = await validateCreate({
      cantidad: -5,  // ❌
      ...otherFields
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('negativo');
  });

  it('rechaza usuario no autorizado', async () => {
    const result = await validateCreate({
      id_comerciable: 1,
      id_usuario: [6],  // Usuario sin rol autorizado
      ...otherFields
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('no está autorizado');
  });
});

// Test ejecución sin validaciones
describe('createVenta', () => {
  it('crea venta y resta inventario', async () => {
    const venta = await createVenta(validData);
    expect(venta.id_venta).toBeDefined();
    
    const producto = await Producto.findByPk(validData.id_comerciable);
    expect(producto.cantidad).toBeLessThan(cantidadAnterior);
  });
});
```

---

## Resumen de Cambios

| Componente | Antes | Después |
|-----------|-------|---------|
| **Service createVenta** | Valida + Ejecuta | Solo ejecuta |
| **Service validateCreate** | No existe | ✅ Nueva función |
| **Controller createVenta** | Ejecuta directo | Valida → Ejecuta |
| **Endpoint /venta/create** | Crea o retorna error | Crea o retorna error validado |
| **Endpoint /venta/validate** | No existe | ✅ Nueva ruta |
| **Transacciones iniciadas** | Aunque haya error | Solo si es válido |
| **Errores de validación** | 400 con error.errors | 400 con errors array |

---

## Beneficios Principales

1. **Separación de Responsabilidades**
   - Validación ≠ Ejecución
   - Cada método hace UNA cosa

2. **Reutilización de Validaciones**
   - `validateCreate` puede usarse en `/venta/validate`
   - `validateCreate` puede usarse en controladores
   - `validateCreate` puede usarse en tests

3. **Mejor Performance**
   - Validación antes de transacción
   - No se inicia BD si hay errores

4. **Testing Más Fácil**
   - Testear validación sin efectos secundarios
   - Testear ejecución sin validaciones

5. **Código Más Limpio**
   - Controladores simples y legibles
   - Métodos con responsabilidad clara
   - Easier debugging


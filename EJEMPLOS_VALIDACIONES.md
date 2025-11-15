# Ejemplos de Uso - Validaciones Separadas

## Nuevo Endpoint: POST /venta/validate

Este endpoint permite validar datos de una venta ANTES de intentar crearla.

### Ejemplo 1: Validación EXITOSA

```bash
curl -X POST 'http://localhost:4000/venta/validate' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
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

**Response (200)**:
```json
{
  "message": "La venta puede ser creada sin problemas",
  "valid": true
}
```

---

### Ejemplo 2: Validación FALLIDA - Campos Obligatorios

```bash
curl -X POST 'http://localhost:4000/venta/validate' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "cantidad": 5,
    "forma_pago": "Efectivo",
    "id_usuario": [5]
    # Faltan: fecha, precio_original_comerciable_cup, etc.
  }'
```

**Response (400)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "Faltan campos obligatorios: fecha, precio_original_comerciable_cup, precio_original_comerciable_usd, precio_cobrado_cup"
  ]
}
```

---

### Ejemplo 3: Validación FALLIDA - Valores Negativos

```bash
curl -X POST 'http://localhost:4000/venta/validate' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "precio_original_comerciable_cup": 100,
    "precio_original_comerciable_usd": 4,
    "cantidad": -5,
    "precio_cobrado_cup": -50,
    "forma_pago": "Efectivo",
    "id_usuario": [5]
  }'
```

**Response (400)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "cantidad no puede ser negativo",
    "precio_cobrado_cup no puede ser negativo"
  ]
}
```

---

### Ejemplo 4: Validación FALLIDA - Usuario No Autorizado

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
    "id_usuario": [6]
  }'
```

Considerando:
- Comerciable 1: roles_autorizados = "Médico,Administrador"
- Usuario 6: rol = "Recepcionista"

**Response (400)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "Usuario \"carlos_recepc\" con rol \"Recepcionista\" no está autorizado a vender producto \"Antibiótico X\" (roles autorizados: Médico, Administrador)"
  ]
}
```

---

### Ejemplo 5: Validación FALLIDA - Cantidad Insuficiente

```bash
curl -X POST 'http://localhost:4000/venta/validate' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fecha": "2025-11-15T10:00:00Z",
    "precio_original_comerciable_cup": 100,
    "precio_original_comerciable_usd": 4,
    "cantidad": 100,
    "precio_cobrado_cup": 100,
    "forma_pago": "Efectivo",
    "id_comerciable": 1,
    "id_usuario": [5]
  }'
```

Considerando:
- Producto en Comerciable 1: cantidad = 5

**Response (400)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "No hay cantidad suficiente del producto \"Antibiótico X\". Disponible: 5, Solicitado: 100"
  ]
}
```

---

### Ejemplo 6: Validación FALLIDA - FK No Existe

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
    "id_cliente": 999,
    "id_usuario": [999]
  }'
```

**Response (400)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "Cliente con id 999 no encontrado",
    "Usuarios no encontrados: 999"
  ]
}
```

---

### Ejemplo 7: Validación FALLIDA - Forma de Pago Inválida

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
    "forma_pago": "Bitcoin",
    "id_usuario": [5]
  }'
```

**Response (400)**:
```json
{
  "message": "Hay errores que impiden la creación de la venta",
  "valid": false,
  "errors": [
    "Forma de pago inválida. Opciones: Efectivo, Transferencia"
  ]
}
```

---

## POST /venta/create - Con Validación Integrada

Ahora el endpoint create también valida ANTES de intentar crear.

### Flujo: Datos Válidos

```bash
POST /venta/create
# Mismo body que validate...
```

1. ✅ `validateCreate()` pasa
2. ✅ Se inicia transacción
3. ✅ Se crea venta
4. ✅ Se descuenta inventario
5. ✅ Se crean asociaciones
6. ✅ COMMIT

**Response (201)**:
```json
{
  "id_venta": 100,
  "fecha": "2025-11-15T10:00:00Z",
  "cantidad": 5,
  "precio_cobrado_cup": 100,
  "id_comerciable": 1,
  "usuarios": [...],
  ...
}
```

---

### Flujo: Datos Inválidos

```bash
POST /venta/create
# Con error (ej: usuario no autorizado)
```

1. ❌ `validateCreate()` falla
2. ❌ Retorna 400 ANTES de transacción
3. ❌ BD no es tocada

**Response (400)**:
```json
{
  "errors": [
    "Usuario \"user\" no está autorizado..."
  ]
}
```

---

## PUT /venta/update/{id} - Con Validación

```bash
curl -X PUT 'http://localhost:4000/venta/update/10' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "cantidad": 15,
    "precio_cobrado_cup": 150
  }'
```

### Validaciones que ejecuta:

1. ✅ Venta existe
2. ✅ Valores numéricos ≥ 0
3. ✅ Si cambia id_comerciable: validar roles y cantidad
4. ✅ Si cambia cantidad: validar cantidad disponible

---

## PUT /venta/{id}/usuarios - Con Validación

```bash
curl -X PUT 'http://localhost:4000/venta/10/usuarios' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "usuarios": [5, 7]
  }'
```

### Validación EXITOSA:

```json
{
  "id_venta": 10,
  "usuarios": [
    { "id_usuario": 5, "nombre_usuario": "juan", "rol": "Médico" },
    { "id_usuario": 7, "nombre_usuario": "ana", "rol": "Administrador" }
  ],
  ...
}
```

### Validación FALLIDA - Usuario No Autorizado:

```json
{
  "errors": [
    "Usuario \"carlos\" con rol \"Recepcionista\" no está autorizado a vender producto \"Antibiótico X\" (roles autorizados: Médico, Administrador)"
  ]
}
```

---

## DELETE /venta/delete/{id} - Con Validación

```bash
curl -X DELETE 'http://localhost:4000/venta/delete/10' \
  -H 'Authorization: Bearer TOKEN'
```

### Validación EXITOSA:

**Response (204)** - Sin contenido

---

### Validación FALLIDA - Venta No Existe:

```json
{
  "errors": ["Venta con id 999 no encontrada"]
}
```

---

## Flujo Completo Recomendado (Frontend + Backend)

### 1. Usuario ingresa datos en formulario

```javascript
const formData = {
  fecha: "2025-11-15T10:00:00Z",
  cantidad: 5,
  precio_cobrado_cup: 100,
  id_comerciable: 1,
  id_usuario: [5]
};
```

### 2. Frontend valida PRIMERO (opcional pero recomendado)

```javascript
// Validar antes de enviar al servidor

## POST /venta/Filter/{limit}/{page} - Ejemplos con `tipo_comerciable`

Filtrado por tipo de comerciable (nuevo parámetro `tipo_comerciable`). Valores: `Producto`, `Medicamento`, `Servicio`, `Servicio Complejo`.

### Ejemplo A: Filtrar solo productos (no medicamentos)

```bash
curl -X POST 'http://localhost:4000/venta/Filter/10/1' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "tipo_comerciable": "Producto" }'
```

**Resultado esperado (200)**: Lista de ventas cuyo `comerciable` es un `producto` y que no tienen información en `medicamento`.

### Ejemplo B: Filtrar solo medicamentos

```bash
curl -X POST 'http://localhost:4000/venta/Filter/10/1' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "tipo_comerciable": "Medicamento" }'
```

**Resultado esperado (200)**: Lista de ventas asociadas a productos que además tienen datos en la tabla `medicamento`.

### Ejemplo C: Filtrar servicios complejos

```bash
curl -X POST 'http://localhost:4000/venta/Filter/10/1' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "tipo_comerciable": "Servicio Complejo" }'
```

**Resultado esperado (200)**: Lista de ventas asociadas a `servicio_complejo`.

Si no se proporciona `tipo_comerciable`, el endpoint devuelve todas las ventas (según otros filtros aplicados).

const validation = await fetch('/venta/validate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(formData)
});

if (validation.status === 200) {
  // Mostrar botón "Crear Venta"
  document.getElementById('createBtn').disabled = false;
} else {
  const data = await validation.json();
  // Mostrar errores en el formulario
  showErrors(data.errors);
  document.getElementById('createBtn').disabled = true;
}
```

### 3. Usuario presiona "Crear Venta"

```javascript
const response = await fetch('/venta/create', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(formData)
});

if (response.status === 201) {
  const venta = await response.json();
  showSuccess(`Venta ${venta.id_venta} creada`);
} else {
  const data = await response.json();
  showErrors(data.errors);
}
```

---

## Comparación: Antes vs Después

### ANTES (Métodos Mezclados)

```javascript
// POST /venta/create
try {
  // Validaciones DENTRO del método
  const validation = validateAllFields(req.body);
  if (!validation.valid) throw new Error(...);
  
  // Inicia transacción AQUÍ
  const t = await sequelize.transaction();
  
  // Más validaciones
  const fkCheck = await validateFK(...);
  if (!fkCheck) throw new Error(...);
  
  // Finalmente, crear
  const venta = await Venta.create(...);
  await t.commit();
} catch (error) {
  // Rollback
}
```

❌ Problemas:
- Transacción iniciada aunque haya error de validación
- Validaciones entremezcladas con lógica
- Difícil reutilizar validaciones
- Hard to test

### DESPUÉS (Métodos Separados)

```javascript
// POST /venta/create
const validation = await validateCreate(req.body);
if (!validation.valid) {
  return res.status(400).json({ errors: validation.errors });
}

// Transacción SOLO si es válido
const venta = await createVenta(req.body);
res.status(201).json(venta);
```

✅ Ventajas:
- ✅ Validación ANTES de transacción
- ✅ Métodos simples y enfocados
- ✅ Reutilizar validaciones en `/venta/validate`
- ✅ Easy to test

---

## Casos de Uso para /venta/validate

### 1. Validación en Frontend

```javascript
// Validar al presionar botón "Validar"
async function onValidateClick() {
  const validation = await fetch('/venta/validate', {...});
  if (validation.ok) {
    alert('✅ Listo para crear la venta');
  } else {
    const { errors } = await validation.json();
    alert('❌ Errores:\n' + errors.join('\n'));
  }
}
```

### 2. Testing sin Efectos Secundarios

```javascript
describe('Venta Validation', () => {
  it('rechaza usuarios no autorizados', async () => {
    const result = await fetch('/venta/validate', {
      body: JSON.stringify({
        id_comerciable: 1,  // Médico, Admin
        id_usuario: [6]     // Recepcionista
      })
    });
    expect(result.status).toBe(400);
    const data = await result.json();
    expect(data.errors[0]).toContain('no está autorizado');
    // ✅ Nada fue creado en la BD
  });
});
```

### 3. API Pública para Validación

```javascript
// Otros servicios pueden consultar validación
// Sin tener que crear ventas para validar
const isValid = await validateVenta(data);
if (isValid) {
  // Procesar venta
}
```

---

## Resumen de Flujos

```
VALIDACIÓN PURA (Sin Efectos Secundarios)
POST /venta/validate
  ↓
  validateCreate(data)
    ├─ Campos obligatorios
    ├─ Valores válidos
    ├─ FK existen
    ├─ Roles autorizados
    └─ Cantidad disponible
  ↓
  { valid: true/false, errors? }
  ↓
  200 OK o 400 Bad Request
  ↓
  ✅ BD intacta
  ✅ Transacción nunca iniciada
  ✅ Sin efectos secundarios


CREACIÓN (Con Validación y Ejecución)
POST /venta/create
  ↓
  validateCreate(data) ← PRIMERO
    └─ { valid, errors }
  ↓
  SI NO VÁLIDO → 400 Bad Request (FIN)
  ↓
  SI VÁLIDO → createVenta(data)
    ├─ BEGIN TRANSACTION
    ├─ Crear venta
    ├─ Descuento inventario
    ├─ Crear asociaciones
    └─ COMMIT
  ↓
  201 Created con venta
  ↓
  ✅ BD modificada
  ✅ Inventario actualizado
```


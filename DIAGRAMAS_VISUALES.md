# Diagramas Visuales - Refactorización de Validaciones

## 1. Flujo de Validación en POST /venta/validate

```
┌─────────────────────────────────────┐
│   REQUEST                           │
│   POST /venta/validate              │
│   Body: { datos de venta }          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   CONTROLLER: validateVenta()       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   SERVICE: validateCreate(body)     │
│                                     │
│   1. Campos obligatorios            │
│   ├─ fecha ✓                        │
│   ├─ cantidad ✓                     │
│   ├─ forma_pago ✓                   │
│   └─ id_usuario ✓                   │
│                                     │
│   2. Valores válidos                │
│   ├─ cantidad ≥ 0 ✓                 │
│   ├─ precios ≥ 0 ✓                  │
│   └─ id_usuario array ✓             │
│                                     │
│   3. ForeignKeys                    │
│   ├─ id_cliente existe ✓            │
│   ├─ id_comerciable existe ✓        │
│   └─ todos id_usuario existen ✓     │
│                                     │
│   4. Roles Autorizados              │
│   ├─ Usuario 1: Médico ✓            │
│   ├─ Usuario 2: Admin ✓             │
│   └─ (Solo si id_comerciable)       │
│                                     │
│   5. Cantidad Disponible            │
│   ├─ Producto: 50 disponible        │
│   ├─ Venta: 5 solicitada ✓          │
│   └─ (Solo si es producto)          │
│                                     │
│   RESULTADO:                        │
│   { valid: true/false, errors }     │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    ✅ VÁLIDO        ❌ INVÁLIDO
        │                 │
        ▼                 ▼
    Status: 200       Status: 400
    {                 {
      "message":        "message": "...",
      "valid": true     "valid": false,
    }                 "errors": [...]
                      }
        │                 │
        └─────────┬───────┘
                  │
                  ▼
        ┌──────────────────┐
        │    RESPONSE      │
        └──────────────────┘
```

---

## 2. Flujo de Creación en POST /venta/create

```
┌─────────────────────────────────────┐
│   REQUEST                           │
│   POST /venta/create                │
│   Body: { datos de venta }          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   CONTROLLER: createVenta()         │
└────────────────┬────────────────────┘
                 │
     ┌───────────▼───────────┐
     │  VALIDAR (NO Tx)      │
     │                       │
     │  validateCreate()     │
     │  ├─ Campos            │
     │  ├─ Valores           │
     │  ├─ FK                │
     │  ├─ Roles             │
     │  └─ Cantidad          │
     │                       │
     │  Result:              │
     │  { valid, errors }    │
     └───────────┬───────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
    VÁLIDO             ❌ INVÁLIDO
        │                  │
        │              Return 400
        │              Errores
        │
        ▼
┌────────────────────────────┐
│  SERVICE: createVenta()    │
│  (SOLO LÓGICA)             │
│                            │
│  BEGIN TRANSACTION  ┐      │
│    │                │      │
│    ├─ CREATE Venta  │      │
│    │   (BD)         │      │
│    │                │      │
│    ├─ UPDATE Producto
│    │   cantidad--   │      │
│    │   (BD)         │      │
│    │                │      │
│    ├─ CREATE VentaUsuario
│    │   (BD)         │      │
│    │                │      │
│  COMMIT  ───────────┘      │
│                            │
│  Return: Venta creada      │
└────────────┬───────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   RESPONSE: 201 Created             │
│   Body: { venta con relaciones }    │
└─────────────────────────────────────┘
```

---

## 3. Comparación: Arquitectura Antes vs Después

### ANTES (Mezclado)
```
POST /venta/create
  │
  └─ createVenta()
     ├─ Validar campo X
     ├─ Validar campo Y
     ├─ Validar FK
     ├─ Validar roles
     ├─ Validar cantidad
     ├─ BEGIN TRANSACTION  ◄── Incluso si hay error
     ├─ Crear
     ├─ Descuentar
     ├─ Asociar
     └─ COMMIT/ROLLBACK

❌ Problemas:
   - Transacción iniciada aunque haya error
   - Validación mezclada con lógica
   - Difícil de reutilizar
   - Difícil de testear
```

### DESPUÉS (Separado)
```
POST /venta/create
  │
  ├─ validateCreate()          ◄── SIN Transacción
  │  ├─ Validar campo X
  │  ├─ Validar campo Y
  │  ├─ Validar FK
  │  ├─ Validar roles
  │  ├─ Validar cantidad
  │  └─ Return { valid, errors }
  │
  ├─ IF válido:
  │  └─ createVenta()          ◄── CON Transacción
  │     ├─ BEGIN TRANSACTION
  │     ├─ Crear
  │     ├─ Descuentar
  │     ├─ Asociar
  │     └─ COMMIT/ROLLBACK
  │
  └─ Response

✅ Ventajas:
   - Validación antes de Tx
   - Métodos simples
   - Reutilizable
   - Fácil de testear
```

---

## 4. Validaciones en Cascada

```
validateCreate(data)
│
├─ 1️⃣ CAMPOS OBLIGATORIOS
│   ├─ fecha ✓
│   ├─ cantidad ✓
│   ├─ precio_cobrado_cup ✓
│   ├─ forma_pago ✓
│   └─ id_usuario ✓
│   └─ Si falta alguno: ❌ STOP
│
├─ 2️⃣ TIPOS Y VALORES
│   ├─ Numéricos ≥ 0 ✓
│   ├─ id_usuario es array ✓
│   └─ Si hay error: ❌ STOP
│
├─ 3️⃣ FOREIGN KEYS
│   ├─ id_cliente existe ✓
│   ├─ id_comerciable existe ✓
│   ├─ todos id_usuario existen ✓
│   └─ Si no existe: ❌ STOP
│
├─ 4️⃣ LÓGICA COMPLEJA (SI FK válido)
│   ├─ Roles autorizados ✓
│   └─ Si no autorizado: ❌ STOP
│
└─ 5️⃣ INVENTARIO (SI ES PRODUCTO)
    ├─ Cantidad disponible ✓
    └─ Si insuficiente: ❌ STOP

Resultado:
  Todas pasan → { valid: true }
  Cualquiera falla → { valid: false, errors: [...] }
```

---

## 5. Flujo de Actualización PUT /venta/update/{id}

```
PUT /venta/update/10
Body: { cantidad: 15, id_comerciable: 2 }

│
├─ validateUpdate(10, body)
│  ├─ Venta 10 existe ✓
│  ├─ Valores válidos ✓
│  ├─ FK existen ✓
│  ├─ (Especial) Cambio de comerciable:
│  │  ├─ Comerciable anterior (1):
│  │  │  └─ Restituir cantidad venta
│  │  ├─ Comerciable nuevo (2):
│  │  │  └─ Validar roles + cantidad
│  │  └─ ✓ OK
│  └─ Return: { valid: true/false, errors }
│
├─ IF válido:
│  └─ updateVenta(10, body)
│     ├─ BEGIN TRANSACTION
│     │
│     ├─ Si cantidad cambió:
│     │  └─ Ajustar inventario
│     │
│     ├─ Si comerciable cambió:
│     │  ├─ Restituir anterior: 40 + 5 = 45
│     │  └─ Descontar nuevo: 30 - 15 = 15
│     │
│     ├─ Actualizar venta
│     │
│     ├─ Si id_usuario cambió:
│     │  ├─ Eliminar asociaciones
│     │  └─ Crear nuevas
│     │
│     └─ COMMIT
│
└─ Response: 200 { venta actualizada }
```

---

## 6. Estado de Transacciones

### POST /venta/create (Inválido)

```
Datos Enviados:
├─ Usuario no autorizado
└─ Cantidad insuficiente

Validación:
├─ validateCreate()
└─ Return: { valid: false, errors: [...] }

Transacción:
└─ NUNCA SE INICIA ✓

BD:
└─ SIN CAMBIOS ✓

Response:
└─ 400 { errors: [...] }
```

### POST /venta/create (Válido)

```
Datos Enviados:
├─ Usuario autorizado ✓
└─ Cantidad suficiente ✓

Validación:
├─ validateCreate()
└─ Return: { valid: true }

Transacción:
├─ BEGIN
├─ Crear venta
├─ Descuentar inventario
├─ Crear asociaciones
└─ COMMIT ✓

BD:
├─ 1 venta nueva
├─ Producto.cantidad--
└─ 1 asociación nueva

Response:
└─ 201 { venta }
```

---

## 7. Métodos de Validación - Matriz

```
┌─────────────────┬────────────────────────┬──────────────────┐
│  Método         │  Valida                │  Retorna         │
├─────────────────┼────────────────────────┼──────────────────┤
│ validateCreate  │ • Campos obligatorios  │ { valid, errors} │
│                 │ • Tipos de dato        │                  │
│                 │ • ForeignKeys          │                  │
│                 │ • Roles autorizados    │                  │
│                 │ • Cantidad disponible  │                  │
├─────────────────┼────────────────────────┼──────────────────┤
│ validateUpdate  │ • Venta existe         │ { valid, errors} │
│                 │ • Tipos de dato        │                  │
│                 │ • ForeignKeys          │                  │
│                 │ • Roles autorizados    │                  │
│                 │ • Cantidad disponible  │                  │
├─────────────────┼────────────────────────┼──────────────────┤
│ validateDelete  │ • Venta existe         │ { valid, errors} │
├─────────────────┼────────────────────────┼──────────────────┤
│ validateUpdate  │ • Venta existe         │ { valid, errors} │
│ Usuarios        │ • Usuarios existen     │                  │
│                 │ • Roles autorizados    │                  │
└─────────────────┴────────────────────────┴──────────────────┘
```

---

## 8. Endpoints Nuevos y Modificados

```
┌────────────────────────┬──────────────────────────────────────┐
│ ENDPOINT (MODIFICADO)  │ CAMBIO                               │
├────────────────────────┼──────────────────────────────────────┤
│ POST /venta/create     │ + Validación previa                  │
│                        │ + Errores capturados antes de Tx     │
│                        │ + Performance mejorada               │
├────────────────────────┼──────────────────────────────────────┤
│ PUT /venta/update/{id} │ + Validación previa                  │
│                        │ + Manejo correcto de cambio comercio │
├────────────────────────┼──────────────────────────────────────┤
│ DELETE /venta/{id}     │ + Validación previa                  │
├────────────────────────┼──────────────────────────────────────┤
│ PUT /venta/{id}/usuarios
│                        │ + Validación previa                  │
│                        │ + Validación de roles                │
└────────────────────────┴──────────────────────────────────────┘

┌────────────────────────┬──────────────────────────────────────┐
│ ENDPOINT (NUEVO)       │ FUNCIÓN                              │
├────────────────────────┼──────────────────────────────────────┤
│ POST /venta/validate   │ Pre-valida sin crear nada            │
│                        │ Retorna 200 si es válida             │
│                        │ Retorna 400 + errores si no          │
└────────────────────────┴──────────────────────────────────────┘
```

---

## 9. Flujo de Error - Ejemplo Real

```
Frontend Usuario ingresa datos:
├─ cantidad: -5 (❌)
├─ id_usuario: [999] (❌)
└─ id_comerciable: 1

Opción A: SIN /venta/validate (Riesgo)
  POST /venta/create
    ├─ BEGIN TRANSACTION (inicia sin validar)
    ├─ Intenta crear (falla)
    ├─ ROLLBACK
    └─ Error 500 (no está claro qué pasó)

Opción B: CON /venta/validate (Recomendado)
  ├─ POST /venta/validate
  │  ├─ validateCreate()
  │  ├─ Detecta errores:
  │  │  ├─ cantidad no puede ser negativo
  │  │  └─ Usuario con id 999 no encontrado
  │  └─ Return 400 { errors: [...] }
  │
  ├─ Frontend muestra errores
  ├─ Usuario corrige datos
  │
  └─ POST /venta/create (datos válidos)
     └─ Success 201

✓ Mejor UX
✓ Sin fallos de BD
✓ Errores claros
```

---

## 10. Ciclo Completo: Validación → Ejecución

```
Usuario
  │
  ▼
┌─ Frontend ─┐
│  Formulario │
│  de Venta   │
└─────┬───────┘
      │
      │ Datos ingresados
      ▼
  ┌────────────────────────────┐
  │ (Opcional) Validación      │
  │ POST /venta/validate       │
  │ "¿Puedo crear esta venta?" │
  └────────────┬───────────────┘
               │
         ┌─────┴─────┐
         ▼           ▼
      ✅ OK        ❌ ERRORES
         │           │
         │      (Mostrar errores)
         │      (Usuario corrige)
         │
         ▼
  ┌──────────────────────────┐
  │  Creación Real           │
  │  POST /venta/create      │
  │  "Crear esta venta"      │
  └────────────┬─────────────┘
               │
         ┌─────┴─────┐
         ▼           ▼
      ✅ 201       ❌ 400
         │           │
         │      (Mostrar errores)
         │
         ▼
  Backend (BD actualizada)
  ├─ 1 venta nueva
  ├─ Inventario descuentado
  └─ Asociaciones creadas
```

---

## 11. Testing: Validación vs Ejecución

```
Test Suite: Validación

├─ describe('validateCreate', () => {
│  ├─ test('rechaza valores negativos')
│  │  └─ No toca BD ✓
│  │
│  ├─ test('rechaza FK no existentes')
│  │  └─ No toca BD ✓
│  │
│  ├─ test('rechaza usuario no autorizado')
│  │  └─ No toca BD ✓
│  │
│  └─ test('rechaza cantidad insuficiente')
│     └─ No toca BD ✓
│
└─ TOTAL: 10 tests, sin efectos secundarios


Test Suite: Ejecución

├─ describe('createVenta', () => {
│  ├─ test('crea venta y descuenta inventario')
│  │  ├─ Crea venta ✓
│  │  └─ Descuenta inventario ✓
│  │
│  ├─ test('maneja rollback en error')
│  │  └─ Sin cambios en BD ✓
│  │
│  └─ test('crea asociaciones correctamente')
│     └─ VentaUsuario creadas ✓
│
└─ TOTAL: 5 tests, con BD (usando transacciones de test)
```

---

## 12. Métodos Exportados

```
services/ventaService.js
│
├─ Métodos públicos:
│  ├─ getAllVentas ✓
│  ├─ getVentaById ✓
│  ├─ createVenta ✓
│  ├─ updateVenta ✓
│  ├─ deleteVenta ✓
│  ├─ filterVentasPaginated ✓
│  ├─ updateVentaUsuarios ✓
│  ├─ validateCreate ✅ (NUEVO)
│  ├─ validateUpdate ✅ (NUEVO)
│  ├─ validateDelete ✅ (NUEVO)
│  └─ validateUpdateUsuarios ✅ (NUEVO)
│
└─ Métodos auxiliares (privados):
   ├─ validateForeignIds
   ├─ validateUsuariosRolesAutorizados
   └─ validateProductoQuantity
```

---

Fin de diagramas visuales


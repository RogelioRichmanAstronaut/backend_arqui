# 🧪 GUÍA COMPLETA DE PRUEBA - SISTEMA TURISMO

> **Última actualización:** 2025-11-27  
> **Versión:** 1.0

---

## 📊 SERVICIOS Y PUERTOS

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | `http://localhost:3333` | Local |
| **Backend Turismo** | `http://localhost:3001` | Local |
| **Banco PSE** | `http://localhost:3000` | Docker/Local |
| **Aerolínea** | `http://10.43.103.34:8080` | Producción (VPN) |
| **Hotel** | `http://10.43.103.234:8080` | Producción (VPN) |

---

## 👥 USUARIOS DE PRUEBA - BANCO

| Documento | Nombre | Email | Contraseña | Balance | Rol |
|-----------|--------|-------|------------|---------|-----|
| `1234567890` | Juan Pérez | juan.perez@email.com | `cliente123` | $5,000,000 | Cliente |
| `9876543210` | María García | maria.garcia@email.com | `cliente123` | $3,000,000 | Cliente |
| `0000000000` | Usuario Invitado | guest@banco.com | `cliente123` | $10,000,000 | Guest |
| `900123456-1` | Solución Turismo | solucion.turismo@sistema.com | `turismo123` | $0 | Empresa |

> **⭐ Recomendado:** Usa `0000000000` con $10M para evitar problemas de fondos

---

## 📦 DATOS DISPONIBLES EN PRODUCCIÓN

### ✈️ Vuelos Disponibles

| Fecha | Ruta | Hora | Precio | Aerolínea |
|-------|------|------|--------|-----------|
| **2025-12-01** | BOG → MDE | 08:00 | $250,000 | Avianca |
| **2025-12-01** | BOG → MDE | 14:00 | $280,000 | Avianca |
| **2025-12-01** | BOG → MDE | 18:00 | $300,000 | Avianca |

> ⚠️ **IMPORTANTE:** Solo hay vuelos para la fecha `2025-12-01` en la ruta `BOG → MDE`

### 🏨 Hoteles Disponibles

| Ciudad | Hotel | Estrellas | Habitación | Precio/noche |
|--------|-------|-----------|------------|--------------|
| Medellín | Ponti-Marriott | ⭐⭐⭐⭐⭐ | Doble Estándar | $400,000 |
| Bogotá | Gran Hotel Andino | ⭐⭐⭐⭐ | Doble Estándar | $400,000 |

> Los hoteles están disponibles para cualquier fecha

### 🌆 Ciudades Disponibles

| Código | Ciudad | País |
|--------|--------|------|
| CO-BOG | Bogotá | Colombia |
| CO-MDE | Medellín | Colombia |
| CO-CTG | Cartagena | Colombia |
| CO-CLO | Cali | Colombia |
| CO-BAQ | Barranquilla | Colombia |

---

## 🚀 PRE-REQUISITOS

### Iniciar todos los servicios

```bash
# Terminal 1 - Base de datos Turismo (Docker)
cd backend_arqui
docker-compose up -d

# Terminal 2 - Backend Turismo
cd backend_arqui
npm run start:dev

# Terminal 3 - Frontend
cd frontend_arqui
npm run dev

# Terminal 4 - Banco PSE (Docker)
cd Banco-PSE-Backend
docker-compose up -d mysql
npm run start:dev  # O docker-compose up backend
```

### Verificar servicios

```bash
# Health checks
curl http://localhost:3001/v1/health  # Backend
curl http://localhost:3333             # Frontend
curl http://localhost:3000             # Banco
```

---

## 📝 PASO A PASO DETALLADO

### PASO 1: ABRIR LA APLICACIÓN

**URL:** `http://localhost:3333/`

- Verás la página de inicio con barra de búsqueda
- Botón "Iniciar sesión" en la esquina superior derecha

✅ **Esperado:** Página de inicio carga correctamente

---

### PASO 2: REGISTRARSE EN TURISMO

**Navegar a:** Click "Iniciar sesión" → `/auth`

1. Click **"¿No tienes cuenta? Regístrate"**
2. Llena el formulario:

| Campo | Valor |
|-------|-------|
| Email | `test@turismo.com` |
| Contraseña | `Test123!` |
| Nombre | `Usuario Prueba` |

3. Click **"Registrarse"**

✅ **Esperado:** Registro exitoso, redirige a completar perfil

---

### PASO 3: COMPLETAR PERFIL

**Página:** `/profile/complete`

| Campo | Valor |
|-------|-------|
| Nombre completo | `Juan Pérez` |
| Teléfono | `3009876543` |
| Tipo de documento | `Cédula de Ciudadanía (CC)` |
| Número de ID | `1234567890` |

> ⚠️ **IMPORTANTE:** Usa el mismo documento que tienes en el banco para facilitar el pago

Click **"Guardar y Continuar"**

✅ **Esperado:** Perfil guardado, redirige al home

---

### PASO 4: BUSCAR HOTEL

**Navegar a:** Click "Paquetes" en navbar → `/packages`

| Campo | Valor | Nota |
|-------|-------|------|
| Destino | `Medellín` o `MDE` | Escribir y seleccionar |
| Check-in | `2025-12-01` | **Misma fecha del vuelo** |
| Check-out | `2025-12-05` | 4 noches |
| Adultos | `2` | |
| Habitaciones | `1` | |

Click **"Buscar"**

✅ **Esperado:** Aparece "Ponti-Marriott Medellín" (5⭐)

---

### PASO 5: SELECCIONAR HOTEL

1. Click en la tarjeta **"Ponti-Marriott Medellín"**
2. Se abre modal con detalles del hotel
3. Selecciona **"Habitación Doble Estándar"** ($400,000/noche)
4. Click **"Reservar"** o **"Continuar"**

✅ **Esperado:** Hotel agregado, redirige a `/flights`

---

### PASO 6: BUSCAR VUELO

**Página:** `/flights`

Si vienes del hotel, el destino y fechas estarán pre-llenados.

| Campo | Valor |
|-------|-------|
| Origen | `BOG - Bogotá` |
| Destino | `MDE - Medellín` *(bloqueado si hay hotel)* |
| Fecha salida | `2025-12-01` |
| Pasajeros | `2` |
| Clase | `Económica` |

Click **"Buscar vuelos"**

✅ **Esperado:** Aparecen 3 vuelos de Avianca

---

### PASO 7: SELECCIONAR VUELO

| Vuelo | Hora | Precio |
|-------|------|--------|
| ✅ **Recomendado** | 08:00 | $250,000 |
| Opción 2 | 14:00 | $280,000 |
| Opción 3 | 18:00 | $300,000 |

1. Click **"Seleccionar"** en el vuelo de las 08:00
2. Se abre modal con detalles del vuelo
3. Click **"Confirmar"** o **"Seleccionar clase"**

✅ **Esperado:** Te lleva a `/flights/confirm`

---

### PASO 7.5: CONFIRMAR VUELO

**Página:** `/flights/confirm`

1. Verás el resumen del vuelo seleccionado
2. Confirma los datos:
   - Origen
   - Destino
   - Fecha
   - Pasajeros
   - Clase seleccionada
3. Click **"Confirmar datos"**

✅ **Esperado:** Vuelo agregado al carrito, redirige a `/cart`

---

### PASO 8: VER CARRITO

**Navegar a:** Click en 🛒 (ícono carrito) → `/cart`

| Item | Detalle | Precio |
|------|---------|--------|
| 🏨 Hotel | Ponti-Marriott (4 noches × $400,000) | $1,600,000 |
| ✈️ Vuelo | Avianca BOG→MDE (2 pasajeros × $250,000) | $500,000 |
| | **TOTAL** | **$2,100,000** |

Click **"Proceder al pago"**

✅ **Esperado:** Inicia proceso de checkout

---

### PASO 11: CHECKOUT (AUTOMÁTICO)

**Al hacer click en "Proceder al pago" el sistema:**

1. Llama `POST /checkout/confirm`
2. Crea `Reservation` en Turismo
3. Pre-reserva Hotel (estado: PENDIENTE)
4. Pre-reserva Aerolínea (estado: PENDIENTE)
5. Llama al Banco para crear pago
6. Banco devuelve `url_banco` (URL de pago)
7. **Redirige DIRECTAMENTE a la página del BANCO**

> ⚠️ **IMPORTANTE:** NO deberías ver una página local `/bank` pidiendo cédula/nombre.  
> El banco tiene su propia página de pago donde el usuario se autentica.

✅ **Esperado:** Toast "Reserva creada, redirigiendo al banco..." → Página del banco

---

### PASO 12: PAGAR EN EL BANCO

**URL del Banco:** `http://localhost:3000/pago/<ID>?ref=BDB-XXXXXXXX-XXXX`

> Esta es la página REAL del banco (no `/bank` de turismo)

La página del banco mostrará:
- Información del pago
- Formulario para autenticarse

1. Ingresa credenciales del banco:

| Campo | Valor |
|-------|-------|
| Documento | `1234567890` |
| Contraseña | `cliente123` |

2. Verifica el monto: **$2,100,000**
3. Click **"Autorizar pago"** o **"Confirmar"**

> **💡 Si balance insuficiente:** Usa documento `0000000000` (Guest con $10M)

4. El banco procesa el pago
5. El banco envía webhook a Turismo (confirma reservas automáticamente)
6. El banco redirige a `url_respuesta` (`/bank/response`)

✅ **Esperado:** Redirige a `/bank/response` con el resultado

---

### PASO 13: CONFIRMACIÓN DE PAGO

**Página:** `/bank/response`

Verás:
- ✅ **"Pago Aprobado"** (o ❌ "Pago Rechazado")
- Referencia: `BDB-20251201-XXXXX`
- Monto: $2,100,000
- Estado: `APROBADA`

> El sistema ya confirmó automáticamente las reservas de hotel y vuelo vía webhook.

Click **"Ver mis reservas"**

✅ **Esperado:** Navegas a `/profile/bookings`

---

### PASO 14: VER RESERVACIONES

**Página:** `/profile/bookings`

| Tipo | Detalle | Estado |
|------|---------|--------|
| 🏨 Hotel | Ponti-Marriott Medellín, 2025-12-01 al 2025-12-05 | ✅ CONFIRMADA |
| ✈️ Vuelo | Avianca BOG→MDE, 2025-12-01 08:00, PNR: XXXXXX | ✅ CONFIRMADA |

✅ **Esperado:** Ambas reservas en estado CONFIRMADA

---

### PASO 15: CANCELAR RESERVA (OPCIONAL)

**Página:** `/profile/bookings`

1. En cualquier reserva, click **"Cancelar"**
2. Confirmar en el diálogo
3. Estado cambia a **CANCELADA**

> ⚠️ Puede aplicar penalidades según políticas del hotel/aerolínea

---

### PASO 14: EDITAR PERFIL (OPCIONAL)

**Navegar a:** Click en 👤 → "Perfil" → `/profile`

- Editar nombre, teléfono, país
- **Zona de peligro:** Eliminar cuenta permanentemente

---

## 🔍 CHECKLIST RÁPIDO

| # | Acción | Página | ✅ |
|---|--------|--------|---|
| 1 | Abrir app | `localhost:3333` | ☐ |
| 2 | Registrarse | `/auth` | ☐ |
| 3 | Completar perfil (doc: `1234567890`) | `/profile/complete` | ☐ |
| 4 | Buscar hotel Medellín (fecha: `2025-12-01`) | `/packages` | ☐ |
| 5 | Seleccionar Ponti-Marriott, habitación doble | `/packages` | ☐ |
| 6 | Confirmar hotel | `/packages/confirm` | ☐ |
| 7 | → Redirige a vuelos | `/flights` | ☐ |
| 8 | Buscar vuelo BOG→MDE (fecha: `2025-12-01`) | `/flights` | ☐ |
| 9 | Seleccionar vuelo 08:00 ($250k) | `/flights` | ☐ |
| 10 | Confirmar vuelo | `/flights/confirm` | ☐ |
| 11 | → Redirige a carrito | `/cart` | ☐ |
| 12 | Ver carrito (total ~$2,100,000) | `/cart` | ☐ |
| 13 | Click "Proceder al pago" | `/cart` | ☐ |
| 14 | → Redirige a página del BANCO | `localhost:3000/pago/...` | ☐ |
| 15 | Pagar (doc: `1234567890`, pass: `cliente123`) | Banco | ☐ |
| 16 | → Redirige a confirmación | `/bank/response` | ☐ |
| 17 | Ver "Pago Aprobado" | `/bank/response` | ☐ |
| 18 | Ver reservaciones confirmadas | `/profile/bookings` | ☐ |

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| "No se encontraron vuelos" | Fecha incorrecta o ruta sin vuelos | Usar fecha `2025-12-01` y ruta `BOG→MDE` |
| "No se encontraron hoteles" | Ciudad mal escrita | Escribir `Medellín` o `Bogotá` exacto |
| Error 500 en búsqueda | Backend caído o VPN desconectada | Verificar backend y conexión VPN |
| "Fondos insuficientes" | Balance bajo en banco | Usar documento `0000000000` (Guest $10M) |
| "Usuario no encontrado" | Doc no existe en banco | Usar `1234567890`, `9876543210` o `0000000000` |
| "Internal server error" en checkout | Banco no accesible | Verificar que banco corre en puerto 3000 |
| Redirige pero banco no carga | URL localhost rechazada | Ya corregido en DTOs del banco |
| "Reserva no encontrada" | No pasó por checkout | Iniciar desde `/cart` con "Proceder al pago" |

---

## 📱 FLUJO VISUAL COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│                         REGISTRO                                 │
├─────────────────────────────────────────────────────────────────┤
│  localhost:3333 → /auth → Registrar → /profile/complete         │
│  (usar doc: 1234567890 para coincidir con banco)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSCAR Y SELECCIONAR                          │
├─────────────────────────────────────────────────────────────────┤
│  /packages → Buscar hotel Medellín (2025-12-01)                 │
│       ↓                                                          │
│  /packages/confirm → Confirmar hotel → Agrega al carrito        │
│       ↓                                                          │
│  /flights → Buscar vuelo BOG→MDE (2025-12-01)                   │
│       ↓                                                          │
│  /flights/confirm → Confirmar vuelo → Agrega al carrito         │
│       ↓                                                          │
│  /cart → Total: $2,100,000                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CHECKOUT                                 │
├─────────────────────────────────────────────────────────────────┤
│  "Proceder al pago" →                                            │
│    POST /checkout/confirm                                        │
│      → Crea Reservation                                          │
│      → Pre-reserva Hotel + Aerolínea                            │
│      → Inicia pago con Banco                                     │
│      → Obtiene bankPaymentUrl                                    │
│      → Redirige al banco                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BANCO                                   │
├─────────────────────────────────────────────────────────────────┤
│  Página del banco (localhost:3000)                               │
│  Documento: 1234567890                                           │
│  Contraseña: cliente123                                          │
│  → Autorizar → Redirige a /bank/response                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONFIRMACIÓN                               │
├─────────────────────────────────────────────────────────────────┤
│  /bank/response → "Pago Aprobado"                                │
│       ↓                                                          │
│  /profile/bookings → Reservas CONFIRMADAS                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 RESUMEN DE DATOS CLAVE

```
📅 FECHAS QUE FUNCIONAN:
   • Hotel: Cualquier fecha futura
   • Vuelo: SOLO 2025-12-01

🏨 HOTELES DISPONIBLES:
   • Medellín: Ponti-Marriott (5⭐) - $400,000/noche
   • Bogotá: Gran Hotel Andino (4⭐) - $400,000/noche

✈️ VUELOS DISPONIBLES:
   • Ruta: BOG → MDE
   • Fecha: 2025-12-01
   • Horarios: 08:00 ($250k), 14:00 ($280k), 18:00 ($300k)

👤 USUARIOS BANCO PARA PAGO:
   • Doc: 1234567890, Pass: cliente123 ($5M)
   • Doc: 9876543210, Pass: cliente123 ($3M)
   • Doc: 0000000000, Pass: cliente123 ($10M) ← RECOMENDADO

💰 EJEMPLO DE PAQUETE COMPLETO:
   • Hotel 4 noches: $1,600,000
   • Vuelo 2 pasajeros: $500,000
   • TOTAL: $2,100,000
```

---

## 🔧 COMANDOS ÚTILES

### Reiniciar servicios

```bash
# Matar proceso en puerto específico
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:3333 | xargs kill -9  # Frontend
lsof -ti:3000 | xargs kill -9  # Banco

# Reiniciar backend
cd backend_arqui && npm run start:dev

# Reiniciar frontend
cd frontend_arqui && npm run dev
```

### Verificar logs

```bash
# Ver logs del backend en tiempo real
tail -f backend_arqui/logs/*.log

# Ver contenedores Docker
docker ps
docker logs banco-pse-backend
```

### Probar endpoints directamente

```bash
# Health check
curl http://localhost:3001/v1/health

# Buscar vuelos
curl -X POST http://localhost:3001/v1/bookings/air/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"originCityId":"CO-BOG","destinationCityId":"CO-MDE","departureAt":"2025-12-01","passengers":2,"cabin":"ECONOMICA"}'

# Buscar hoteles
curl -X POST http://localhost:3001/v1/bookings/hotels/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"cityId":"CO-MDE","checkIn":"2025-12-01","checkOut":"2025-12-05","adults":2,"rooms":1}'
```

---

## 📚 REFERENCIAS

- **Documentación oficial:** `backend_arqui/docs/docs.txt`
- **Tests de integración:** `backend_arqui/test/integration-tests.http`
- **API del Banco:** `Banco-PSE-Backend/README.md`

---

**¿Problemas?** Revisa la sección de errores comunes o contacta al equipo de desarrollo.


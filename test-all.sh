#!/bin/bash
set +H

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHR1cmlzbW8uY29tIiwic3ViIjoiMTQ5NjZiYmItYmVhNC00YWM1LThhZjgtNmIxNGViNGQwMGQwIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY0MjI1MDY0LCJleHAiOjE3NjQyNTM4NjR9.9pWETmz9wp66yuxsb129hJxE7lGMWep0RH7iaCvBuPw"

echo "==========================================="
echo "PRUEBA COMPLETA DE 22 CASOS DE USO"
echo "==========================================="

# CASO 0: HEALTH
echo ""
echo "=== CASO 0: HEALTH ==="
echo "0.1 Health:"
curl -s http://localhost:3001/v1/health
echo ""
echo "0.2 Ready:"
curl -s http://localhost:3001/v1/ready
echo ""

# CASO 1: AUTH
echo ""
echo "=== CASO 1: AUTENTICACIÓN ==="
echo "1.1 Login:"
curl -s -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@turismo.com","password":"Admin123!"}'
echo ""

# CASO 2: CLIENTES
echo ""
echo "=== CASO 2: CLIENTES ==="
RANDOM_ID="CC-$(date +%s)"
echo "2.1 Crear Cliente ($RANDOM_ID):"
CLIENT_RESP=$(curl -s -X POST http://localhost:3001/v1/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"clientId\":\"$RANDOM_ID\",\"name\":\"Test Cliente\",\"email\":\"test$(date +%s)@test.com\",\"phone\":\"3001234567\"}")
echo "$CLIENT_RESP"
CLIENT_UUID=$(echo "$CLIENT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "2.2 Consultar Cliente:"
curl -s "http://localhost:3001/v1/clients/$CLIENT_UUID" -H "Authorization: Bearer $TOKEN"
echo ""

# CASO 3: CATÁLOGO
echo ""
echo "=== CASO 3: CATÁLOGO ==="
echo "3.1 Ciudades (primeras 3):"
curl -s http://localhost:3001/v1/catalog/cities -H "Authorization: Bearer $TOKEN" | head -c 300
echo "..."

# CASO 4: VUELOS
echo ""
echo "=== CASO 4: VUELOS ==="
echo "4.1 Buscar Vuelos BOG→MDE:"
FLIGHTS=$(curl -s -X POST http://localhost:3001/v1/bookings/air/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"originCityId":"CO-BOG","destinationCityId":"CO-MDE","departureAt":"2025-12-01","passengers":2,"cabin":"ECONOMICA"}')
echo "$FLIGHTS" | head -c 400
FLIGHT_ID=$(echo "$FLIGHTS" | grep -o '"flightId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""
echo "FLIGHT_ID: $FLIGHT_ID"

echo "4.2 Pre-reservar Vuelo:"
RESERVATION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
FLIGHT_RESERVE=$(curl -s -X POST http://localhost:3001/v1/bookings/air/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"flightId\":\"$FLIGHT_ID\",\"clientId\":\"CC-1020304050\",\"reservationId\":\"$RESERVATION_ID\",\"passengers\":[{\"name\":\"Test User\",\"document\":\"CC-1020304050\"}]}")
echo "$FLIGHT_RESERVE"
FLIGHT_RES_ID=$(echo "$FLIGHT_RESERVE" | grep -o '"flightReservationId":"[^"]*"' | cut -d'"' -f4)

echo "4.3 Confirmar Vuelo:"
curl -s -X POST http://localhost:3001/v1/bookings/air/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"flightReservationId\":\"$FLIGHT_RES_ID\",\"transactionId\":\"BDB-$(date +%Y%m%d)-TEST1\"}"
echo ""

# CASO 5: HOTELES
echo ""
echo "=== CASO 5: HOTELES ==="
echo "5.1 Buscar Hoteles Medellín:"
HOTELS=$(curl -s -X POST http://localhost:3001/v1/bookings/hotels/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cityId":"CO-MDE","checkIn":"2025-12-15","checkOut":"2025-12-20","adults":2,"rooms":1}')
echo "$HOTELS" | head -c 400
HOTEL_ID=$(echo "$HOTELS" | grep -o '"hotelId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""
echo "HOTEL_ID: $HOTEL_ID"

echo "5.2 Pre-reservar Hotel:"
HOTEL_RES_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
HOTEL_RESERVE=$(curl -s -X POST http://localhost:3001/v1/bookings/hotels/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"hotelId\":\"$HOTEL_ID\",\"roomId\":\"doble\",\"clientId\":\"CC-1020304050\",\"checkIn\":\"2025-12-15\",\"checkOut\":\"2025-12-20\",\"reservationId\":\"$HOTEL_RES_ID\",\"rooms\":1,\"adults\":2}")
echo "$HOTEL_RESERVE"
HOTEL_RES_ID=$(echo "$HOTEL_RESERVE" | grep -o '"hotelReservationId":"[^"]*"' | cut -d'"' -f4)

echo "5.3 Confirmar Hotel:"
curl -s -X POST http://localhost:3001/v1/bookings/hotels/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"hotelReservationId\":\"$HOTEL_RES_ID\",\"transactionId\":\"BDB-$(date +%Y%m%d)-TEST2\"}"
echo ""

# CASO 6: CARRITO
echo ""
echo "=== CASO 6: CARRITO ==="
echo "6.1 Limpiar Carrito:"
curl -s -X DELETE "http://localhost:3001/v1/cart?clientId=CC-1020304050" -H "Authorization: Bearer $TOKEN"
echo ""

echo "6.2 Agregar Vuelo al Carrito:"
curl -s -X POST http://localhost:3001/v1/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"clientId":"CC-1020304050","currency":"COP","kind":"AIR","refId":"f47ac10b-58cc-4372-a567-0e02b2c3d479","quantity":1,"price":250000,"metadata":{"flightId":"f47ac10b-58cc-4372-a567-0e02b2c3d479","passengers":[{"name":"María Pérez","doc":"CC-1020304050"}],"originCityId":"CO-BOG","destinationCityId":"CO-MDE","departureAt":"2025-12-01T08:00:00"}}'
echo ""

echo "6.3 Ver Carrito:"
CART=$(curl -s "http://localhost:3001/v1/cart?clientId=CC-1020304050" -H "Authorization: Bearer $TOKEN")
echo "$CART"
CART_ID=$(echo "$CART" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "CART_ID: $CART_ID"

# CASO 7: CHECKOUT
echo ""
echo "=== CASO 7: CHECKOUT ==="
echo "7.1 Quote:"
curl -s -X POST http://localhost:3001/v1/checkout/quote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"clientId":"CC-1020304050"}'
echo ""

echo "7.2 Confirm (con banco):"
IDEMPOTENCY="checkout-$(date +%s)"
curl -s -X POST http://localhost:3001/v1/checkout/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY" \
  -d "{\"clientId\":\"CC-1020304050\",\"currency\":\"COP\",\"cartId\":\"$CART_ID\",\"description\":\"Paquete Test\",\"returnUrl\":\"http://localhost:3333/bank/response\",\"callbackUrl\":\"http://localhost:3001/v1/payments/webhook\"}"
echo ""

# CASO 8: RESERVACIONES
echo ""
echo "=== CASO 8: RESERVACIONES ==="
echo "8.1 Listar Reservaciones:"
curl -s "http://localhost:3001/v1/reservations?clientId=CC-1020304050" -H "Authorization: Bearer $TOKEN" | head -c 500
echo ""

echo ""
echo "==========================================="
echo "FIN DE PRUEBAS"
echo "==========================================="



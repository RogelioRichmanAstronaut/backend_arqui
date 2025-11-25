# Configuración de Google OAuth

## Pasos para configurar Google OAuth

### 1. Instalar dependencias

```bash
cd backarqui/backend_arqui
npm install passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

### 2. Crear credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs & Services" > "Credentials"
4. Haz clic en "Create Credentials" > "OAuth client ID"
5. Si es la primera vez, configura la pantalla de consentimiento OAuth:
   - Tipo de aplicación: Externa
   - Nombre de la aplicación: Tu aplicación
   - Email de soporte: Tu email
   - Dominios autorizados: localhost (para desarrollo)
   - Guarda y continúa
6. Selecciona "Web application" como tipo de aplicación
7. Agrega las siguientes URLs:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://localhost:3001`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/v1/auth/google/callback`
8. Copia el **Client ID** y **Client Secret**

### 3. Configurar variables de entorno

Agrega las siguientes variables a tu archivo `.env` en `backarqui/backend_arqui/`:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/v1/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

### 4. Reiniciar el servidor

```bash
npm run start:dev
```

### 5. Probar

1. Ve a `http://localhost:3001/auth`
2. Haz clic en "Continuar con Google"
3. Deberías ser redirigido a Google para autenticarte
4. Después de autenticarte, serás redirigido de vuelta a la aplicación

## Notas importantes

- Los usuarios que se registren con Google se crearán automáticamente en la base de datos
- Si un usuario ya existe con ese email, simplemente se autenticará
- Los usuarios de Google no necesitan contraseña para iniciar sesión (tienen un hash aleatorio)
- Asegúrate de que las URLs en Google Cloud Console coincidan exactamente con las que usas

## Solución de problemas

- **Error 400: redirect_uri_mismatch**: Verifica que la URL de callback en `.env` coincida exactamente con la configurada en Google Cloud Console
- **Error al iniciar sesión**: Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén correctamente configurados
- **No se crea el usuario**: Verifica que la base de datos esté corriendo y que Prisma esté configurado correctamente


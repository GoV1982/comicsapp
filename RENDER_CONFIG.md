# Render Deployment Configuration

## Build Settings

### Backend (Web Service)
```yaml
Name: comiqueria-backend
Environment: Node
Region: Oregon (US West) o el más cercano
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### Environment Variables (Backend)
```
NODE_ENV=production
PORT=3002
JWT_SECRET=tu_clave_super_secreta_cambiar_esto_123456
DATABASE_URL=postgresql://... (se genera automáticamente si usas PostgreSQL de Render)
GOOGLE_SHEETS_SPREADSHEET_ID=tu_id_aqui (opcional)
```

## Database Configuration (PostgreSQL)

### PostgreSQL Settings
```yaml
Name: comiqueria-db
Database: comiqueria
Region: Same as backend
Instance Type: Free
```

**Important:** Después de crear la base de datos, copia la "Internal Database URL" y agrégala como variable `DATABASE_URL` en el backend.

## Health Check Endpoint

Render usará `/health` para verificar que el servicio esté funcionando:
- Endpoint: `https://your-app.onrender.com/health`
- Expected response: `{"status":"ok"}`

## Post-Deployment

1. Espera a que el deploy termine (puede tomar 5-10 minutos)
2. Visita `https://your-app.onrender.com/health` para verificar
3. Copia la URL completa para usarla en el frontend

## Notes

- El servicio gratuito se "duerme" después de 15 minutos de inactividad
- La primera petición después de dormirse puede tomar 30-60 segundos
- Límite: 750 horas/mes (suficiente para uso personal)
- Para mantenerlo activo 24/7, considera usar un servicio como UptimeRobot para hacer ping cada 14 minutos

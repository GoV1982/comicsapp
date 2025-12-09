# Vercel Deployment Configuration

## Project Settings

```yaml
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Environment Variables

Agregar en Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://tu-backend.onrender.com/api
```

**Important:** Reemplaza `tu-backend.onrender.com` con la URL real de tu backend desplegado en Render.

## Deployment Process

1. Import Git Repository
2. Select frontend directory as root
3. Vercel detectará automáticamente que es Vite
4. Agregar la variable de entorno `VITE_API_URL`
5. Click "Deploy"

## Post-Deployment

1. Visita tu sitio en `https://tu-proyecto.vercel.app`
2. Verifica que pueda conectarse al backend
3. Prueba el login y funcionalidades principales

## Custom Domain (Opcional)

1. Ve a Settings → Domains
2. Agrega tu dominio
3. Configura DNS según las instrucciones
4. Vercel provee HTTPS automáticamente

## Notes

- El deploy es instantáneo (1-2 minutos)
- Cada push a main re-deploya automáticamente
- CDN global para máxima velocidad
- Bandwidth ilimitado en plan gratuito

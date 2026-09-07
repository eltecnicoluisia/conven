# 🏢 CONVEN - Sistema de Gestión y Administración de Condominios

[![Live Demo](https://img.shields.io/badge/Demo_en_Vivo-GitHub_Pages-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://eltecnicoluisia.github.io/conven/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

Plataforma integral de administración, facturación y gestión inmobiliaria diseñada específicamente para el contexto normativo y económico de **Venezuela**. Incorpora conciliación multimoneda en tiempo real (**Bolívares y Dólares con tasa oficial BCV**), control de alícuotas, emisión de recibos de cobro digitales, seguimiento de morosidad y portal de autogestión de residentes.

---

## 🌐 Demostración Interactiva en Vivo (24/7)

Puedes interactuar con la plataforma completa directamente desde tu navegador sin instalar nada:

👉 **[https://eltecnicoluisia.github.io/conven/](https://eltecnicoluisia.github.io/conven/)**

---

## ✨ Características Principales

### 📊 1. Panel de Control y Telemetría
- Indicadores en tiempo real: recaudación del mes (USD y Bs.), porcentaje de cobranza y fondo de reserva.
- Monitor de morosidad con alertas preventivas y desglose de apartamentos insolventes.
- Integración automática con la tasa de cambio oficial del Banco Central de Venezuela (BCV).

### 🧾 2. Facturación y Recibos de Cobro
- Cálculo automático de cuotas según alícuotas de copropiedad (Ley de Propiedad Horizontal).
- Distribución proporcional de gastos comunes, imprevistos y fondos de reserva.
- Generación y descarga instantánea de recibos en formato **PDF** con código QR de verificación.
- Exportación masiva de estados de cuenta a hojas de cálculo **Excel (`.xlsx`)**.

### 👥 3. Directorio de Residentes y Copropietarios
- Padrón digital de apartamentos, propietarios, inquilinos y contactos de emergencia.
- Registro de comprobantes de pago (transferencias bancarias, Pago Móvil, Zelle, efectivo).
- Estados de cuenta históricos individuales y control de solvencia.

### 🛠️ 4. Control de Mantenimiento y Proveedores
- Registro cronológico de gastos comunes (ascensores, bombas hidroneumáticas, vigilancia, áreas comunes).
- Clasificación presupuestaria por categorías de servicio e imputación contable.

---

## 🏗️ Arquitectura del Sistema

```
CONVEN/
├── CONVEN_Desktop/            # Backend y servicios centrales de la aplicación
│   ├── src/                   # Lógica de negocio, APIs de facturación y base de datos
│   └── package.json           # Dependencias del servidor
├── CONVEN_Desktop_Front/      # Frontend administrativo de alta reactividad
│   ├── src/                   # Componentes React, dashboard y vistas
│   ├── dist/                  # Bundle de producción optimizado para GitHub Pages
│   └── vite.config.ts         # Configuración de empaquetado Vite
├── docker-compose.yml         # Orquestación de contenedores para despliegue local o en la nube
├── Dockerfile                 # Imagen Docker reproducible
└── README.md                  # Documentación oficial del proyecto
```

---

## 🚀 Despliegue Rápido con Docker

Para levantar la solución completa en tu propio servidor o infraestructura local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/eltecnicoluisia/conven.git
cd conven

# 2. Desplegar con Docker Compose
docker compose up -d --build

# 3. Acceder a la plataforma
# Navega en tu navegador a: http://localhost:3002
```

---

## 👨‍💻 Autor y Contacto

Desarrollado y mantenido por:

**Luis Uzcategui**  
Director, InformaticaVES  
- **Portafolio Interactivo:** [https://tecnicouzcategui.github.io/curriculum/](https://tecnicouzcategui.github.io/curriculum/)  
- **Sitio Web:** [https://tecnicouzcategui.github.io/informaticaves/index.html](https://tecnicouzcategui.github.io/informaticaves/index.html)  
- **Teléfono / WhatsApp:** 0424-2964339  
- **Correo Electrónico:** tecnicouzcategui@gmail.com / eltecnicoluisia@gmail.com  
- **GitHub:** [@eltecnicoluisia](https://github.com/eltecnicoluisia)

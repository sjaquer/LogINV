# 🌾 LogINV – Agro-Industrial Inventory Management System

<p align="center">
  <img src="./loginv_banner.png" alt="LogINV Banner" width="100%">
</p>

<p align="center">
  <strong>Advanced inventory and logistics platform for agro-industrial plants and balanced feed manufacturers.</strong><br/>
  Real-time stock control • Expiration Alerts • ROP (Reorder Point) engine • Approval Workflow • Multilingual Support
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.5-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Firebase-10.12.2-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License MIT">
</p>

---

## 🇪🇸 Descripción (Español)

**LogINV** es una solución integral para la gestión de inventarios diseñada específicamente para molinos agroindustriales y plantas de producción de alimentos. El sistema ofrece un control granular sobre materias primas, productos terminados e insumos veterinarios, optimizando la cadena de suministro mediante alertas inteligentes y flujos de trabajo automatizados.

### ✨ Características Principales
- **Dashboard Inteligente:** KPIs en tiempo real, alertas de stock crítico (ROP) y semáforo de vencimientos dinámico.
- **Gestión de Stock:** Control de lotes, pesos unitarios, proveedores y trazabilidad completa.
- **Motor ROP (Punto de Reorden):** Sugerencias automáticas de abastecimiento basadas en niveles críticos.
- **Workflow de Aprobación:** Flujo jerárquico de solicitudes: `Pendiente` → `Admin` → `Gerencia` → `Comprado`.
- **Multilingüe:** Soporte nativo para Español, Inglés, Chino y Japonés.

---

## 🇺🇸 Description (English)

**LogINV** is a comprehensive inventory management solution designed specifically for agro-industrial mills and food production plants. The system provides granular control over raw materials, finished products, and veterinary supplies, optimizing the supply chain through intelligent alerts and automated workflows.

### ✨ Key Features
- **Smart Dashboard:** Real-time KPIs, critical stock alerts (ROP), and dynamic expiration "traffic light" system.
- **Stock Management:** Batch control, unit weights, suppliers, and full traceability.
- **ROP Engine (Reorder Point):** Automatic supply suggestions based on critical stock levels.
- **Approval Workflow:** Hierarchical request flow: `Pending` → `Admin` → `Management` → `Purchased`.
- **Multilingual:** Native support for Spanish, English, Chinese, and Japanese.

---

## 🛠️ Tech Stack | Tecnologías

| Technology | Usage |
| :--- | :--- |
| **Next.js 14** | Core Framework (App Router) |
| **Firebase / Firestore** | Real-time Database & Persistence |
| **Tailwind CSS** | Premium Responsive UI Design |
| **Lucide React** | Modern Iconography |
| **Radix UI** | Accessible UI Components |
| **Context API** | State Management (Roles & Internationalization) |

---

## 🚀 Getting Started | Inicio Rápido

### 1. Installation | Instalación
```bash
git clone https://github.com/sjaquer/LogINV.git
cd LogINV
npm install
```

### 2. Environment Setup | Configuración del Entorno
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials and demo passwords.

### 3. Database Seeding | Poblar Base de Datos
To populate your Firestore with industrial sample data:
```bash
npm run seed
```

### 4. Run Development | Ejecutar Desarrollo
```bash
npm run dev
```

---

## 🔐 Role System | Sistema de Roles

The system uses a security layer for role switching (demo mode). You can configure these passwords in your `.env.local`:

| Role | Default Pass | Permissions |
| :--- | :--- | :--- |
| **LOGISTICA** | `1234` | Stock updates, product creation, merma logs. |
| **PLANTA** | `5678` | View-only + stock updates. |
| **ADMIN** | `admin` | Full access + Admin level approvals. |
| **GERENCIA** | `master` | Full access + Executive level validation. |

---

## 📱 Responsive Design | Diseño Adaptable

LogINV is built with a **Mobile-First** approach:
- **Desktop:** Full data-grid view with advanced filters.
- **Mobile:** Optimized card-based layouts and touch-friendly interfaces.
- **Animations:** Smooth transitions using CSS variables and Tailwind keyframes.

---

## 📄 License | Licencia

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Developed for the Agro-Industrial Sector 🌾<br/>
  <strong>LogINV – Smart Inventory Control</strong>
</p>

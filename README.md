# F-CRM - Sistema de Gestión de Relaciones con Clientes

CRM moderno construido con React, TypeScript, Tailwind CSS, Shadcn UI y Firebase.

## 🚀 Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: Shadcn UI (todos los componentes instalados)
- **Backend**: Firebase (Firestore, Storage, Analytics)
- **Routing**: React Router DOM
- **Iconos**: Lucide React

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Copia .env.example a .env y completa con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 📁 Estructura del Proyecto

```
src/
├── features/              # Features del CRM (arquitectura por features)
│   ├── dashboard/
│   │   ├── components/    # Componentes específicos de Dashboard
│   │   ├── hooks/         # Hooks específicos de Dashboard
│   │   ├── services/      # Servicios específicos de Dashboard
│   │   ├── types/         # Tipos específicos de Dashboard
│   │   └── dashboard-page.tsx
│   ├── clients/
│   │   ├── components/    # Componentes específicos de Clients
│   │   ├── hooks/         # Hooks específicos de Clients
│   │   ├── services/      # Servicios específicos de Clients
│   │   ├── types/         # Tipos específicos de Clients
│   │   └── clients-page.tsx
│   └── reports/
│       ├── components/    # Componentes específicos de Reports
│       ├── hooks/         # Hooks específicos de Reports
│       ├── services/      # Servicios específicos de Reports
│       ├── types/         # Tipos específicos de Reports
│       └── reports-page.tsx
│
├── shared/                # Código compartido entre features
│   ├── components/        # Componentes reutilizables
│   ├── hooks/             # Hooks compartidos
│   ├── services/          # Servicios compartidos (Firebase, API)
│   ├── utils/             # Funciones helper
│   └── types/             # Tipos TypeScript compartidos
│
├── components/
│   ├── layout/            # Componentes de layout (Sidebar, Header)
│   └── ui/                # Componentes de Shadcn UI
│
└── lib/                   # Configuraciones (Firebase, etc)
```

## 🎯 Convenciones de Código

### Organización por Features

Cada feature contiene todo su código relacionado:
- **components/**: Componentes específicos del feature
- **hooks/**: Hooks personalizados del feature
- **services/**: Lógica de negocio y llamadas a APIs/Firebase
- **types/**: Interfaces y tipos TypeScript del feature
- **[feature]-page.tsx**: Componente principal de la página

### Shared vs Feature-specific

**Usa `shared/` cuando:**
- El código se usa en **múltiples features**
- Es un componente genérico reutilizable
- Es un servicio base (ej: Firebase helpers)
- Son tipos comunes a toda la aplicación

**Usa `features/[feature]/` cuando:**
- El código es **específico de un solo feature**
- Es lógica de negocio particular del dominio
- Son tipos específicos del feature

### Nomenclatura

#### Archivos
- **Componentes**: `PascalCase.tsx` (ej: `ClientCard.tsx`)
- **Hooks**: `camelCase.ts` con prefijo `use` (ej: `useClientForm.ts`)
- **Services**: `camelCase.ts` con sufijo `.service` (ej: `clients.service.ts`)
- **Types**: `camelCase.ts` con sufijo `.types` (ej: `client.types.ts`)
- **Utils**: `kebab-case.ts` (ej: `date-formatter.ts`)

#### Código
- **Componentes**: `PascalCase` (ej: `ClientCard`)
- **Funciones/Variables**: `camelCase` (ej: `getClientById`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_CLIENTS`)
- **Interfaces**: `PascalCase` con prefijo `I` opcional (ej: `Client` o `IClient`)
- **Types**: `PascalCase` (ej: `ClientStatus`)

### Imports

Usa alias `@/` para imports absolutos:

```typescript
// ✅ Correcto
import { Button } from "@/components/ui/button"
import { useClientForm } from "@/features/clients/hooks/useClientForm"
import { db } from "@/lib/firebase"

// ❌ Evitar
import { Button } from "../../../components/ui/button"
```

### Componentes

```typescript
// Componente funcional con TypeScript
interface ClientCardProps {
  client: Client
  onEdit: (id: string) => void
}

export function ClientCard({ client, onEdit }: ClientCardProps) {
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Services

```typescript
// src/features/clients/services/clients.service.ts
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs } from "firebase/firestore"
import type { Client } from "../types/client.types"

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const snapshot = await getDocs(collection(db, "clients"))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client))
  },

  async create(client: Omit<Client, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "clients"), client)
    return docRef.id
  },
}
```

### Hooks

```typescript
// src/features/clients/hooks/useClients.ts
import { useState, useEffect } from "react"
import { clientsService } from "../services/clients.service"
import type { Client } from "../types/client.types"

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const data = await clientsService.getAll()
    setClients(data)
    setLoading(false)
  }

  return { clients, loading, refresh: loadClients }
}
```

## 🔥 Firebase

### Configuración

Las credenciales están en `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### Uso

```typescript
import { db, storage, analytics } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"

// Firestore
await addDoc(collection(db, "clients"), { name: "Juan" })

// Storage
// Usa storage para subir archivos

// Analytics
// analytics se inicializa automáticamente
```

## 🎨 Componentes UI

Todos los componentes de Shadcn UI están instalados. Importa desde `@/components/ui/`:

```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table } from "@/components/ui/table"
// ... y 45+ componentes más
```

## 🧭 Navegación

El proyecto usa React Router con un Sidebar de Shadcn:

- **Dashboard**: `/` - Página principal con estadísticas
- **Clientes**: `/clients` - Gestión de clientes
- **Reportes**: `/reports` - Reportes y análisis

Para agregar una nueva ruta:

1. Crea el feature en `src/features/[nombre]/`
2. Agrega la ruta en `src/App.tsx`
3. Agrega el item al menú en `src/components/layout/app-sidebar.tsx`

## 📝 Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview del build
npm run lint         # Ejecutar ESLint
```

## 🤝 Contribuir

1. Sigue las convenciones de nomenclatura
2. Mantén la estructura por features
3. Usa TypeScript estricto
4. Documenta funciones complejas
5. Usa Shadcn UI para componentes

## 📚 Documentación Adicional

- [STRUCTURE.md](./STRUCTURE.md) - Detalles de la estructura del proyecto
- [Shadcn UI](https://ui.shadcn.com/) - Documentación de componentes
- [Firebase](https://firebase.google.com/docs) - Documentación de Firebase
- [React Router](https://reactrouter.com/) - Documentación de routing

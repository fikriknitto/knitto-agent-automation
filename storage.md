# File Manager (Local Storage Version)

## Storage Strategy

Gunakan local filesystem:

```txt
storage/
│  images/
│  documents/
│  videos/
│  audio/
│  others/

```

Root storage:

```ts
const STORAGE_ROOT = path.join(process.cwd(), "storage");
```

---

## Folder Structure

Gunakan kebab-case untuk seluruh folder dan file.

```txt
src/
├── app/
│   └── api/
│       ├── file-manager/
│       │   ├── files/
│       │   │   ├── route.ts
│       │   │
│       │   ├── upload-file/
│       │   │   └── route.ts
│       │   │
│       │   ├── search-files/
│       │   │   └── route.ts
│       │   │
│       │   ├── bulk-delete/
│       │   │   └── route.ts
│       │   │
│       │   ├── create-folder/
│       │   │   └── route.ts
│       │   │
│       │   └── move-file/
│       │       └── route.ts
│
├── components/
│   └── file-manager/
│       ├── file-manager-modal.tsx
│       ├── file-grid.tsx
│       ├── file-list.tsx
│       ├── file-card.tsx
│       ├── breadcrumb-nav.tsx
│       ├── search-bar.tsx
│       ├── upload-button.tsx
│       ├── context-menu.tsx
│       └── preview-modal.tsx
│
├── hooks/
│   ├── use-files.ts
│   ├── use-upload.ts
│   └── use-folders.ts
│
├── services/
│   └── file-api.ts
│
├── stores/
│   └── file-manager-store.ts
│
├── lib/
│   ├── file-system.ts
│   ├── file-utils.ts
│   ├── folder-utils.ts
│   └── storage-service.ts
│
└── types/
    └── file-manager.ts
```

---

## API Endpoints (kebab-case)

### Files

```http
GET    /api/file-manager/files
GET    /api/file-manager/files?folder-id=:id

POST   /api/file-manager/upload-file

PATCH  /api/file-manager/rename-file/:id

PATCH  /api/file-manager/move-file/:id

DELETE /api/file-manager/delete-file/:id

POST   /api/file-manager/bulk-delete
```

### Folders

```http
POST   /api/file-manager/create-folder

PATCH  /api/file-manager/rename-folder/:id

DELETE /api/file-manager/delete-folder/:id

GET    /api/file-manager/folder-path/:id
```

### Search

```http
GET /api/file-manager/search-files?q=document
```

---

## Database Schema

### Folder

```prisma
model Folder {
  id          String   @id @default(uuid())

  name        String
  slug        String

  parentId    String?

  parent      Folder? @relation(
    "FolderTree",
    fields: [parentId],
    references: [id]
  )

  children    Folder[] @relation("FolderTree")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  files       File[]
}
```

### File

```prisma
model File {
  id            String   @id @default(uuid())

  name          String
  originalName  String

  mimeType      String
  extension     String

  size          BigInt

  relativePath  String
  absolutePath  String

  folderId      String?

  folder        Folder? @relation(
    fields: [folderId],
    references: [id]
  )

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## Local Storage Service

```ts
export interface StorageService {
  upload(file: Buffer, path: string): Promise<string>;

  delete(path: string): Promise<void>;

  move(
    source: string,
    destination: string
  ): Promise<void>;

  exists(path: string): Promise<boolean>;

  createFolder(path: string): Promise<void>;
}
```

Implementation:

```ts
import fs from "fs/promises";
import path from "path";
```

Tidak menggunakan:

* AWS S3
* Cloudflare R2
* Supabase Storage
* MinIO

Semua file disimpan langsung ke:

```txt
storage/*
```

Contoh:

```txt
storage/uploads/images/banner.jpg

storage/uploads/documents/invoice.pdf

storage/uploads/videos/demo.mp4
```

---

## File Upload Flow

```txt
User Upload
    ↓
Next.js API
    ↓
Validation
    ↓
Generate UUID
    ↓
Save File
    ↓
storage/uploads/*
    ↓
Save Metadata Database
    ↓
Return Success
```

---

## URL Preview

```txt
/storage/uploads/images/banner.jpg
```

atau

```txt
/api/file-manager/file-preview/:id
```

untuk keamanan yang lebih baik.

---

## Naming Convention

Semua wajib menggunakan kebab-case:

### Folder

```txt
file-manager
search-files
upload-file
create-folder
```

### File

```txt
file-manager-modal.tsx
file-card.tsx
search-bar.tsx
file-api.ts
folder-utils.ts
```

### Endpoint

```http
/api/file-manager/upload-file

/api/file-manager/create-folder

/api/file-manager/search-files
```

### Zustand Store

```txt
file-manager-store.ts
```

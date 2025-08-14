# Auth Cloud Webapp

A comprehensive authentication and file management system built with Better Auth, supporting both Next.js and Astro frameworks with Cloudflare R2 storage.

## Features

### Authentication

- User registration and login
- Email verification
- Profile management with avatar upload
- Session management
- Secure authentication with Better Auth

### File Management System

- **Universal File Upload**: Support for any file type up to 100MB
- **Webflow Integration**: Perfect for background videos, images, and other assets
- **Drag & Drop Interface**: Modern, intuitive file upload experience
- **File Organization**: Automatic categorization by file type (Image, Video, Audio, Document, Archive)
- **URL Management**: Easy copy-to-clipboard functionality for direct use in Webflow
- **Security**: File validation and user-specific storage isolation
- **Cloud Storage**: Powered by Cloudflare R2 for fast, global content delivery

## Project Structure

```
auth-cloud-webapp/
├── betterauth-astro/          # Astro version
│   ├── src/
│   │   ├── pages/
│   │   │   ├── api/
│   │   │   │   ├── files/     # File management API endpoints
│   │   │   │   └── ...
│   │   │   ├── files.astro    # File management page
│   │   │   └── ...
│   │   └── utils/
│   │       ├── file-service.ts # R2 file service
│   │       └── file-api.ts     # Client-side API utilities
│   └── ...
├── betterauth-nextjs/         # Next.js version
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── files/     # File management API endpoints
│   │   │   │   └── ...
│   │   │   ├── files/         # File management page
│   │   │   └── ...
│   │   └── lib/
│   │       ├── file-service.ts # R2 file service
│   │       └── file-api.ts     # Client-side API utilities
│   └── ...
└── ...
```

## File Management Features

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP, SVG, etc.
- **Videos**: MP4, WebM, MOV, AVI, etc.
- **Audio**: MP3, WAV, OGG, etc.
- **Documents**: PDF, DOC, TXT, etc.
- **Archives**: ZIP, RAR, TAR, etc.
- **Any other file type** (with security restrictions)

### File Size Limits

- **Maximum**: 100MB per file
- **Recommended**: Optimize large files for web use

### Security Features

- File type validation
- Dangerous file extension blocking
- User-specific file isolation
- Authenticated access only
- CORS support for web access

## API Endpoints

### File Upload

```
POST /api/files/upload
Content-Type: multipart/form-data
Body: { file: File }
```

### List Files

```
GET /api/files/list
```

### Delete File

```
DELETE /api/files/delete
Content-Type: application/json
Body: { key: string }
```

### Serve File

```
GET /api/files/[key]
```

## Usage in Webflow

1. **Upload Files**: Use the File Manager to upload your assets
2. **Copy URLs**: Click "Copy URL" to get the direct link
3. **Use in Webflow**: Paste the URL in Webflow's asset fields
4. **Background Videos**: Perfect for Webflow's background video elements
5. **Images**: Use for hero images, galleries, and other visual content

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account with R2 storage
- Better Auth configuration

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd auth-cloud-webapp
   ```

2. **Install dependencies**

   ```bash
   # For Next.js version
   cd betterauth-nextjs
   npm install

   # For Astro version
   cd betterauth-astro
   npm install
   ```

3. **Configure environment variables**

   ```env
   # R2 Configuration
   USER_AVATARS=your-r2-bucket-binding

   # Better Auth
   BETTERAUTH_SECRET=your-secret
   BETTERAUTH_URL=your-domain

   # Database
   DB=your-d1-database
   ```

4. **Deploy to Cloudflare**

   ```bash
   # For Next.js
   npm run build
   npx wrangler deploy

   # For Astro
   npm run build
   npx wrangler deploy
   ```

## Development

### Running Locally

```bash
# Next.js
npm run dev

# Astro
npm run dev
```

### File Management Development

The file management system is built with:

- **Backend**: Cloudflare R2 for storage
- **Frontend**: React (Next.js) or vanilla JS (Astro)
- **API**: RESTful endpoints with authentication
- **UI**: Modern, responsive design with drag & drop

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

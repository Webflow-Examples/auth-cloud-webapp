# Uppy Multipart Upload Options for Cloudflare Workers

## **Available Options**

### **1. @uppy/aws-s3-multipart** 🎯 **RECOMMENDED**

Uppy's **native multipart plugin** that works with S3-compatible services like R2.

```typescript
import AwsS3Multipart from "@uppy/aws-s3-multipart";

uppy.use(AwsS3Multipart, {
  createMultipartUpload: async (file) => {
    // Call your /api/files/multipart/init endpoint
  },
  signPart: async (file, { key, uploadId, partNumber }) => {
    // Call your /api/files/multipart/get-part-urls-batch endpoint
  },
  completeMultipartUpload: async (file, { key, uploadId, parts }) => {
    // Call your /api/files/multipart/complete endpoint
  },
});
```

**✅ Pros:**

- Built-in multipart support
- Automatic chunking and progress
- Resume uploads
- Uses your existing multipart endpoints
- No timeout issues

**❌ Cons:**

- More complex configuration
- Requires custom endpoint mapping

### **2. @uppy/xhr-upload** (Current)

Simple upload plugin that sends entire file in one request.

```typescript
import XHRUpload from "@uppy/xhr-upload";

uppy.use(XHRUpload, {
  endpoint: "/api/files/upload",
  // No multipart support
});
```

**✅ Pros:**

- Simple configuration
- Works for small files

**❌ Cons:**

- No multipart support
- Timeout risk on large files
- Limited to ~100MB files

### **3. @uppy/tus**

TUS protocol for resumable uploads.

```typescript
import Tus from "@uppy/tus";

uppy.use(Tus, {
  endpoint: "https://your-tus-server.com/files",
  chunkSize: 10 * 1024 * 1024,
});
```

**✅ Pros:**

- Resumable uploads
- Chunked uploads

**❌ Cons:**

- Requires TUS server (not available in Cloudflare Workers)
- Additional infrastructure needed

## **Comparison Table**

| Plugin             | Multipart Support | CF Worker Compatible | Timeout Safe        | Complexity | Resume Uploads |
| ------------------ | ----------------- | -------------------- | ------------------- | ---------- | -------------- |
| **XHRUpload**      | ❌ No             | ✅ Yes               | ❌ No (large files) | 🟢 Low     | ❌ No          |
| **AwsS3Multipart** | ✅ Yes            | ✅ Yes               | ✅ Yes              | 🟡 Medium  | ✅ Yes         |
| **TUS**            | ✅ Yes            | ❌ No                | ✅ Yes              | 🔴 High    | ✅ Yes         |

## **Recommended Approach**

### **Option A: Pure AwsS3Multipart** 🎯

Use Uppy's native multipart plugin with your existing R2 endpoints:

```typescript
// Use the new uppy-r2-multipart.ts
import { uppyR2MultipartUploader } from "./uppy-r2-multipart";
```

**Benefits:**

- ✅ Full multipart support
- ✅ No timeout issues
- ✅ Resume uploads
- ✅ Professional UI
- ✅ Uses your existing infrastructure

### **Option B: Hybrid Approach** (Current)

Keep the hybrid approach for simplicity:

```typescript
// Small files: XHRUpload
// Large files: Custom multipart
```

**Benefits:**

- ✅ Simple for small files
- ✅ Reliable for large files
- ✅ No additional complexity

## **Implementation**

I've created `uppy-r2-multipart.ts` that:

1. **Uses AwsS3Multipart plugin**
2. **Maps to your existing endpoints**:

   - `createMultipartUpload` → `/api/files/multipart/init`
   - `signPart` → `/api/files/multipart/get-part-urls-batch`
   - `completeMultipartUpload` → `/api/files/multipart/complete`

3. **Provides the same interface** as your current Uppy setup

## **Recommendation**

**Use the AwsS3Multipart approach** (`uppy-r2-multipart.ts`) because:

1. **Native multipart support** - No timeout issues
2. **Resume uploads** - Better user experience
3. **Professional UI** - Uppy's dashboard
4. **Uses your infrastructure** - No additional setup needed
5. **Future-proof** - Handles any file size

This gives you the **best of both worlds**: Uppy's professional UI + reliable multipart uploads! 🚀

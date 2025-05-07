"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUploadStore } from "@/store/use-upload-store"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import apiClient from "@/lib/api-client"
import { redirect } from 'next/navigation';

// Redirige a la versión localizada
export default function UploadPage() {
  redirect('/es/upload');
}
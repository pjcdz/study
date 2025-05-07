"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Loader2, ClipboardCopy, Check, Zap, Edit } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import apiClient from "@/lib/api-client"
import { redirect } from 'next/navigation';

// Redirige a la versión localizada
export default function SummaryPage() {
  redirect('/es/summary');
}
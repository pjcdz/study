"use client"

import { useState } from "react"
import { useRouter, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ClipboardCopy, Check, ExternalLink } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"

// Redirige a la versión localizada
export default function FlashcardsPage() {
  redirect('/es/flashcards');
}
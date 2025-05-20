"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, ExternalLink, Copy, Check, Info } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useApiKey } from "@/lib/hooks/useApiKey"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

export default function ApiPage() {
  const t = useTranslations('api')
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { isAvailable, saveApiKey, getApiKey, clearApiKey } = useApiKey()
  const router = useRouter()
  const pathname = usePathname()

  // Guardar la API key
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(t('errors.emptyKey'))
      return
    }
    
    // Mostrar indicador de carga
    const loadingToast = toast.loading(t('success.savingKey', {defaultValue: 'Guardando API key...'}))
    
    try {
      // Guardar API key usando la versión con promesa
      await saveApiKey(apiKey)
      
      // Dismis loading toast y mostrar éxito
      toast.dismiss(loadingToast)
      toast.success(t('success.keySaved'))
      setApiKey("")
      
      // Esperar un momento para asegurar que la UI se actualice (opcional)
      setTimeout(() => {
        // Redireccionar a la página de upload
        const locale = pathname.split('/')[1]
        router.push(`/${locale}/upload`)
      }, 100)
    } catch (error) {
      // Dismis loading toast y mostrar error
      toast.dismiss(loadingToast)
      console.error('Error guardando API key:', error)
      toast.error(t('errors.saveFailed', {defaultValue: 'Error al guardar la API key'}))
    }
  }
  
  // Limpiar la API key
  const handleClearKey = () => {
    clearApiKey()
    toast.success(t('success.keyCleared'))
  }
  
  // Copiar la API key existente
  const handleCopyKey = () => {
    const key = getApiKey()
    if (key) {
      navigator.clipboard.writeText(key)
        .then(() => {
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
          toast.success(t('success.keyCopied'))
        })
        .catch(() => {
          toast.error(t('errors.copyFailed'))
        })
    }
  }

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="max-w-3xl mx-auto space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold mb-2 text-center">{t('title')}</h1>
          <p className="text-center text-muted-foreground">{t('description')}</p>
        </motion.div>
        
        {/* API Key Management Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyRound className="mr-2 h-5 w-5" />
                {t('keyManagement.title')}
              </CardTitle>
              <CardDescription>{t('keyManagement.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAvailable ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 p-3 rounded-md">
                    <Check className="text-green-600 dark:text-green-400 h-5 w-5" />
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      {t('keyManagement.keyConfigured')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowKey(!showKey)}
                      className="flex-1"
                    >
                      {showKey ? t('keyManagement.hideKey') : t('keyManagement.showKey')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyKey}
                      className="flex-1"
                    >
                      {isCopied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {t('keyManagement.copyKey')}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleClearKey}
                      className="flex-1"
                    >
                      {t('keyManagement.deleteKey')}
                    </Button>
                  </div>
                  
                  {showKey && (
                    <div className="mt-2">
                      <Input 
                        type="text" 
                        value={getApiKey() || ''} 
                        readOnly 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('keyManagement.securityWarning')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-md">
                    <Info className="text-amber-600 dark:text-amber-400 h-5 w-5" />
                    <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                      {t('keyManagement.noKeyConfigured')}
                    </p>
                  </div>
                  
                  {/* Removed the Open Google AI Studio button as it's now in the fixed footer */}
                  
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder={t('keyManagement.enterKey')}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button 
                      onClick={handleSaveApiKey}
                      className="w-full"
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      {t('keyManagement.saveKey')}
                    </Button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                {t('keyManagement.storageNote')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* API Key Instructions Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                {t('instructions.title')}
              </CardTitle>
              <CardDescription>{t('instructions.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">{t('instructions.whatIs')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('instructions.apiDescription')}
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">{t('instructions.howToGet')}</h3>
                <ol className="list-decimal list-inside space-y-6">
                  <li className="text-sm">
                    <span className="font-medium">{t('instructions.steps.step1.title')}</span>
                    <p className="mt-1 text-muted-foreground">
                      Si ves la ventana emergente "It's time to build", haz clic en el botón "Get API key".
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="https://i.imgur.com/CyGI6FK.png" 
                        alt={t('instructions.steps.step1.title')} 
                        width={600}
                        height={300}
                        className="w-full"
                      />
                    </div>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium">{t('instructions.steps.step2.title')}</span>
                    <p className="mt-1 text-muted-foreground">
                      A continuación, aparecerá una ventana para aceptar los términos. Marca la casilla que dice "I consent to the Google APIs Terms of Service and the Gemini API Additional Terms of Service and acknowledge that I have read the Google Privacy Policy*" y luego haz clic en el botón "I accept".
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="https://i.imgur.com/TXXVAyA.png" 
                        alt={t('instructions.steps.step2.title')} 
                        width={600}
                        height={300}
                        className="w-full"
                      />
                    </div>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium">{t('instructions.steps.step3.title')}</span>
                    <p className="mt-1 text-muted-foreground">
                      Serás dirigido a la página de "API Keys". Haz clic en el botón azul "+ Create API key" que se encuentra en la esquina superior derecha.
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="https://i.imgur.com/0sfgHAi.png" 
                        alt={t('instructions.steps.step3.title')} 
                        width={600}
                        height={300}
                        className="w-full"
                      />
                    </div>
                  </li>
                  
                  <li className="text-sm">
                    <span className="font-medium">{t('instructions.steps.step4.title')}</span>
                    <p className="mt-1 text-muted-foreground">
                      Aparecerá una ventana emergente titulada "API key generated" mostrando tu nueva clave. Haz clic en el botón "Copy" para copiarla a tu portapapeles.
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="https://i.imgur.com/USHmhXt.png" 
                        alt={t('instructions.steps.step4.title')} 
                        width={600}
                        height={300}
                        className="w-full"
                      />
                    </div>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Se elimina el botón redundante - ya existe en el footer */}
      </motion.div>
      
      {/* Fixed footer with appropriate button depending on API key status */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
        <div className="flex justify-center gap-4" style={{ opacity: 1, transform: 'none' }}>
          {isAvailable ? (
            // Si la API key está configurada, mostrar botón para volver a la aplicación
            <Button 
              variant="default" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6 has-[>svg]:px-4"
              onClick={() => {
                const locale = pathname.split('/')[1]
                router.push(`/${locale}/upload`)
              }}
            >
              {t('actions.returnToApp')}
            </Button>
          ) : (
            // Si no hay API key configurada, mostrar botón para ir a Google AI Studio
            <Button 
              variant="outline" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 rounded-md px-6 has-[>svg]:px-4"
              onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('actions.getApiKey')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
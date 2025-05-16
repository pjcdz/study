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
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error(t('errors.emptyKey'))
      return
    }
    
    // Guardar API key
    saveApiKey(apiKey)
    toast.success(t('success.keySaved'))
    setApiKey("")
    
    // Redireccionar a la página de upload
    const locale = pathname.split('/')[1]
    router.push(`/${locale}/upload`)
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
                  
                  {/* Botón prominente para obtener API key */}
                  <Button 
                    onClick={() => {
                      window.open("https://aistudio.google.com/app/apikey", "_blank")
                    }}
                    className="w-full"
                    size="lg"
                    variant="default"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    {t('actions.getApiKey')}
                  </Button>
                  
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
                      {t('instructions.steps.step1.description')}
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="/api-instructions/step1.png" 
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
                      {t('instructions.steps.step2.description')}
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="/api-instructions/step2.png" 
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
                      {t('instructions.steps.step3.description')}
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="/api-instructions/step3.png" 
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
                      {t('instructions.steps.step4.description')}
                    </p>
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <Image 
                        src="/api-instructions/step4.png" 
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
        
        {/* Botones de acción */}
        <motion.div variants={itemVariants} className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              window.open("https://aistudio.google.com/app/apikey", "_blank")
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('actions.getApiKey')}
          </Button>
          
          {isAvailable && (
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                const locale = pathname.split('/')[1]
                router.push(`/${locale}/upload`)
              }}
            >
              {t('actions.returnToApp')}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
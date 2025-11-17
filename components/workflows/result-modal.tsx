'use client';

import { Copy, Download, Minimize, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MarkdownPreview } from '@/components/markdown/markdown-preview';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  contentType: 'markdown' | 'tsv' | 'text';
  stageType?: 'summary' | 'flashcards' | 'content';
  onCondense?: () => void;
  isCondensing?: boolean;
}

export function ResultModal({
  isOpen,
  onClose,
  title,
  content,
  contentType,
  stageType,
  onCondense,
  isCondensing = false,
}: ResultModalProps) {
  const t = useTranslations('workflows');
  const tSummary = useTranslations('summary');
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t('toast.copied'));
    } catch (error) {
      toast.error(t('toast.copyError'));
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.${
      contentType === 'tsv' ? 'tsv' : contentType === 'markdown' ? 'md' : 'txt'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('toast.exported'));
  };

  const renderContent = () => {
    if (contentType === 'markdown') {
      return <MarkdownPreview content={content} />;
    }

    if (contentType === 'tsv') {
      // Parse TSV and render as table
      const lines = content.split('\n').filter((line) => line.trim());
      if (lines.length === 0) return <p>No hay contenido</p>;

      const rows = lines.map((line) => line.split('\t'));

      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                {rows[0].map((header, i) => (
                  <th
                    key={i}
                    className="border border-border px-4 py-2 text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-border px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Plain text
    return (
      <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
        {content}
      </pre>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="my-4">{renderContent()}</div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {stageType === 'summary' && onCondense && (
            <Button 
              variant="outline" 
              onClick={onCondense}
              disabled={isCondensing}
              className="w-full sm:w-auto"
            >
              {isCondensing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tSummary('actions.condensing', { defaultValue: 'Resumiendo...' })}
                </>
              ) : (
                <>
                  <Minimize className="w-4 h-4 mr-2" />
                  {tSummary('actions.condense', { defaultValue: 'Resumir más' })}
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {t('actions.copy')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            {t('actions.export')}
          </Button>
          <Button onClick={onClose}>{t('actions.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

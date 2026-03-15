import { useState } from 'react';
import { useListFiles, useGeneratePdf, useGenerateZip, getListFilesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileArchive, FileText, Download, Plus, Trash2, Loader2, Archive } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FilesPage() {
  const queryClient = useQueryClient();
  const { data: files, isLoading } = useListFiles();
  const generatePdf = useGeneratePdf();
  const generateZip = useGenerateZip();

  // PDF Form State
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfContent, setPdfContent] = useState('');

  // ZIP Form State
  const [zipName, setZipName] = useState('');
  const [zipFiles, setZipFiles] = useState([{ filename: '', content: '' }]);

  const handleGeneratePdf = () => {
    if (!pdfTitle || !pdfContent) return;
    generatePdf.mutate({ data: { title: pdfTitle, content: pdfContent, format: 'A4' } }, {
      onSuccess: () => {
        setPdfTitle('');
        setPdfContent('');
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
      }
    });
  };

  const handleGenerateZip = () => {
    if (!zipName || zipFiles.some(f => !f.filename || !f.content)) return;
    generateZip.mutate({ data: { name: zipName, files: zipFiles } }, {
      onSuccess: () => {
        setZipName('');
        setZipFiles([{ filename: '', content: '' }]);
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
      }
    });
  };

  const addZipFile = () => {
    setZipFiles([...zipFiles, { filename: '', content: '' }]);
  };

  const removeZipFile = (index: number) => {
    setZipFiles(zipFiles.filter((_, i) => i !== index));
  };

  const updateZipFile = (index: number, field: 'filename' | 'content', value: string) => {
    const updated = [...zipFiles];
    updated[index][field] = value;
    setZipFiles(updated);
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 relative">
      <div className="flex items-end justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary flex items-center gap-3 neon-text">
            <FileArchive className="w-8 h-8" />
            FILE_SYSTEM
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm max-w-lg">
            Artifact generation matrix. Export generated outputs to standard formats.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 flex-1 overflow-hidden">
        {/* Left Col: File List */}
        <div className="lg:col-span-5 flex flex-col h-full bg-card/30 border border-border/50 rounded-xl overflow-hidden neon-border">
          <div className="p-4 border-b border-border/50 bg-background/50">
            <h3 className="font-mono text-sm uppercase text-secondary tracking-widest flex items-center gap-2">
              <Archive className="w-4 h-4" /> STORED_ARTIFACTS
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-lg border border-border/30" />
                ))}
              </div>
            ) : files?.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <FileArchive className="w-8 h-8 mb-2" />
                <p className="font-mono text-xs uppercase tracking-widest">NO_FILES_FOUND</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files?.map((file) => (
                  <div key={file.id} className="p-4 rounded-lg bg-background/60 border border-border hover:border-primary/50 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild size="sm" className="h-7 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-mono text-[10px]">
                        <a href={file.downloadUrl} download>
                          <Download className="w-3 h-3 mr-1" /> DL
                        </a>
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted/30 flex items-center justify-center text-primary border border-primary/20">
                        {file.type === 'pdf' ? <FileText className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-mono text-sm text-foreground/90 font-bold truncate max-w-[200px]">{file.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-mono py-0 h-4 bg-muted/20">
                            {file.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 font-mono">
                            {format(new Date(file.createdAt), 'MM/dd HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Col: Generators */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <Tabs defaultValue="pdf" className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-xl bg-card/50 border border-border/50 h-12 p-1 mb-6">
              <TabsTrigger value="pdf" className="font-mono text-xs uppercase data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
                Document_Generator (PDF)
              </TabsTrigger>
              <TabsTrigger value="zip" className="font-mono text-xs uppercase data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-[0_0_10px_hsl(var(--secondary)/0.2)]">
                Archive_Builder (ZIP)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="flex-1 mt-0 outline-none">
              <Card className="glass-panel border-primary/20 h-full flex flex-col">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="font-mono text-lg text-primary">PDF_COMPILER</CardTitle>
                  <CardDescription className="font-mono text-xs">Render markdown content to a formatted PDF document.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted-foreground uppercase">Document Title</label>
                    <Input 
                      value={pdfTitle} 
                      onChange={e => setPdfTitle(e.target.value)} 
                      placeholder="e.g. System_Report_01"
                      className="font-mono bg-background/50 border-border focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="font-mono text-xs text-muted-foreground uppercase">Markdown Content</label>
                    <Textarea 
                      value={pdfContent} 
                      onChange={e => setPdfContent(e.target.value)} 
                      placeholder="# Heading\n\nContent..."
                      className="font-mono text-sm resize-none flex-1 bg-background/50 border-border focus-visible:ring-primary/50"
                    />
                  </div>
                  <Button 
                    onClick={handleGeneratePdf} 
                    disabled={generatePdf.isPending || !pdfTitle || !pdfContent}
                    className="w-full font-mono text-xs shadow-[0_0_15px_hsl(var(--primary)/0.3)] bg-primary/20 hover:bg-primary border border-primary text-primary hover:text-primary-foreground"
                  >
                    {generatePdf.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    EXECUTE_PDF_RENDER
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="zip" className="flex-1 mt-0 outline-none">
              <Card className="glass-panel border-secondary/20 h-full flex flex-col">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="font-mono text-lg text-secondary">ARCHIVE_PACKAGER</CardTitle>
                  <CardDescription className="font-mono text-xs">Bundle multiple text files into a downloadable ZIP archive.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-6 flex flex-col overflow-hidden">
                  <div className="space-y-2 mb-6 shrink-0">
                    <label className="font-mono text-xs text-muted-foreground uppercase">Archive Name</label>
                    <Input 
                      value={zipName} 
                      onChange={e => setZipName(e.target.value)} 
                      placeholder="e.g. project-files"
                      className="font-mono bg-background/50 border-border focus-visible:ring-secondary/50"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <label className="font-mono text-xs text-muted-foreground uppercase">File Manifest</label>
                    <Button variant="ghost" size="sm" onClick={addZipFile} className="h-6 px-2 text-xs font-mono text-secondary hover:bg-secondary/10 hover:text-secondary">
                      <Plus className="w-3 h-3 mr-1" /> ADD_FILE
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {zipFiles.map((file, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-background/40 border border-border relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeZipFile(idx)}
                            disabled={zipFiles.length === 1}
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          
                          <div className="space-y-3 mr-6">
                            <Input 
                              value={file.filename}
                              onChange={e => updateZipFile(idx, 'filename', e.target.value)}
                              placeholder={`file_${idx + 1}.txt`}
                              className="h-8 font-mono text-xs bg-background/80 border-border"
                            />
                            <Textarea 
                              value={file.content}
                              onChange={e => updateZipFile(idx, 'content', e.target.value)}
                              placeholder="File content..."
                              className="font-mono text-xs min-h-[80px] bg-background/80 border-border resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Button 
                    onClick={handleGenerateZip} 
                    disabled={generateZip.isPending || !zipName || zipFiles.some(f => !f.filename || !f.content)}
                    className="w-full shrink-0 font-mono text-xs shadow-[0_0_15px_hsl(var(--secondary)/0.3)] bg-secondary/20 hover:bg-secondary border border-secondary text-secondary hover:text-secondary-foreground"
                  >
                    {generateZip.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                    PACK_ARCHIVE
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, Plus, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateMailItem } from "@/hooks/use-mail-items";
import { useToast } from "@/hooks/use-toast";

export function UploadArea() {
  const [isProcessing, setIsProcessing] = useState(false);
  const createMailItem = useCreateMailItem();
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await createMailItem.mutateAsync(formData);
      
      toast({
        title: "Document processed successfully!",
        description: "Your document has been analyzed and added to your collection.",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error processing your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [createMailItem, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await processFile(acceptedFiles[0]);
  }, [processFile]);

  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);



  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Reset input value to allow same file selection
    event.target.value = '';
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <div className="mb-8">
      {/* Hidden file inputs for camera and scan */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />


      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50/50' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
        } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="processing-content">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">AI Analyzing Document</h3>
            <p className="text-slate-600">Extracting text and categorizing content with GPT-4o...</p>
          </div>
        ) : (
          <div className="upload-content">
            <CloudUpload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Your Mail</h3>
            <p className="text-slate-600 mb-4">
              {isDragActive 
                ? "Drop your scanned mail here..." 
                : "Drag and drop your scanned mail or click to browse"
              }
            </p>
            
            {/* Upload methods */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button 
                type="button"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose File
              </button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraCapture}
                className="inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
              

            </div>
            
            <p className="text-xs text-slate-400 mt-4">
              Supports: JPEG, PNG, PDF (max 10MB) • Works with iPhone Notes scan feature
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

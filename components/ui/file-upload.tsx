import * as React from "react"
import { UploadCloud, X, FileText, FileImage, File } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  acceptedFileTypes?: string
  maxFiles?: number
  maxSizeMB?: number
  uploadedFiles: File[]
  onRemoveFile: (index: number) => void
}

export function FileUpload({
  onFilesSelected,
  acceptedFileTypes = ".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx",
  maxFiles = 3,
  maxSizeMB = 10,
  uploadedFiles,
  onRemoveFile
}: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFiles = (files: File[]): File[] => {
    setError(null)
    
    // Check if adding these files would exceed the max number
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`)
      return []
    }
    
    // Filter files by type and size
    const validFiles = Array.from(files).filter(file => {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB size limit.`)
        return false
      }
      
      // Check file type
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`File "${file.name}" is not a supported file type.`)
        return false
      }
      
      return true
    })
    
    return validFiles
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.dataTransfer.files))
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.target.files))
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-500" />
    } else if (['doc', 'docx', 'rtf', 'txt'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-blue-500" />
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-orange-500" />
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <FileImage className="h-4 w-4 text-green-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-md p-4 text-center ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          accept={acceptedFileTypes}
          className="hidden"
        />
        
        <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Drag and drop files here</p>
        <p className="text-xs text-muted-foreground mb-2">
          or
        </p>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleButtonClick}
          className="mx-auto"
        >
          Select Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Supported formats: PDF, Word, PowerPoint, Text ({maxFiles} files max, {maxSizeMB}MB each)
        </p>
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium mb-1">Uploaded files:</p>
          <div className="space-y-1">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-muted/30 rounded-md px-2 py-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  {getFileIcon(file.name)}
                  <span className="text-xs truncate">{file.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
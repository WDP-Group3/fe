import { useState, useRef } from 'react';
import { Button } from './index';

const FileUpload = ({
  label,
  accept,
  multiple = false,
  maxSize,
  error,
  helperText,
  required = false,
  size = 'md',
  disabled = false,
  value,
  onChange,
  className = '',
  ...props
}) => {
  const [files, setFiles] = useState(value || []);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    
    // Validate file size
    if (maxSize) {
      const invalidFiles = newFiles.filter(file => file.size > maxSize);
      if (invalidFiles.length > 0) {
        alert(`Một số file vượt quá kích thước tối đa ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
    }

    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
    setFiles(updatedFiles);
    onChange?.(multiple ? updatedFiles : updatedFiles[0]);
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange?.(multiple ? updatedFiles : updatedFiles[0]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={`mb-1 block font-medium text-slate-700 ${
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        }`}>
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-indigo-400 bg-indigo-50'
            : error
            ? 'border-rose-300 bg-rose-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <svg className="mb-2 h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mb-1 text-sm text-slate-700">
            <span className="font-semibold text-indigo-600">Click để upload</span> hoặc kéo thả file vào đây
          </p>
          <p className="text-xs text-slate-500">
            {accept && `Định dạng: ${accept}`}
            {maxSize && ` • Tối đa: ${(maxSize / 1024 / 1024).toFixed(2)}MB`}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="!rounded-lg ml-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default FileUpload;


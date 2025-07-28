import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  elementText: string;
  frameName: string;
  componentType: string;
  screenSection: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  elementText,
  frameName,
  componentType,
  screenSection
}) => {
  if (!isOpen) return null;

  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Text Context Preview
            </h3>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                {componentType}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                {screenSection}
              </span>
              <span className="text-slate-500">
                in {frameName}
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Text Content */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Text Content:</h4>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-900 leading-relaxed">
                "{elementText}"
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Visual Context:</h4>
            <div className="flex justify-center">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg border border-slate-300"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              This preview shows where "{elementText}" appears in the {frameName} frame
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              <span className="font-medium">Tip:</span> Click outside the modal or press Esc to close
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
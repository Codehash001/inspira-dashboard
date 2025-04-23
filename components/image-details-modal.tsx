import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';

const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  }
});

interface ImageDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: {
    imageId: string;
    imageUrl: string;
    resolution: string;
    quality?: string;
    prompt?: string;
    createdAt: string;
    creditUsed: number;
    tokenUsed: number;
  };
}

export function ImageDetailsModal({ open, onOpenChange, image }: ImageDetailsModalProps) {
  // Extract public ID from the full URL
  const urlParts = image.imageUrl.split('/');
  const publicIdWithExt = urlParts[urlParts.length - 1];
  const publicId = publicIdWithExt.split('.')[0];

  const img = cld
    .image(`generated_images/${publicId}`)
    .format('auto')
    .quality('auto');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Image Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Image Container */}
            <div className="relative rounded-lg overflow-hidden bg-black/5">
              <AdvancedImage
                cldImg={img}
                alt={image.prompt || 'Generated image'}
                className="w-full h-auto object-contain max-h-[60vh]"
              />
            </div>
            
            {/* Details */}
            <div className="space-y-6">
              {/* Prompt */}
              {image.prompt && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Prompt</h3>
                  <p className="text-sm">{image.prompt}</p>
                </div>
              )}
              
              {/* Image Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/50 rounded-lg p-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Resolution</h3>
                  <p className="text-sm mt-1">{image.resolution}</p>
                </div>
                
                {image.quality && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Quality</h3>
                    <p className="text-sm mt-1 capitalize">{image.quality}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Credits Used</h3>
                  <p className="text-sm mt-1">{image.creditUsed.toFixed(3)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm mt-1">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex justify-end">
              <Button
                onClick={() => window.open(image.imageUrl, '_blank')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Original
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

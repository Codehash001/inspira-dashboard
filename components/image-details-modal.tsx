import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
      <DialogContent className="max-w-4xl">
        <div className="space-y-6">
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
            <AdvancedImage
              cldImg={img}
              alt={image.prompt || 'Generated image'}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-4">
            {image.prompt && (
              <div>
                <h3 className="font-semibold text-lg">Prompt</h3>
                <p className="text-muted-foreground">{image.prompt}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="font-semibold">Resolution</h3>
                <p className="text-muted-foreground">{image.resolution}</p>
              </div>
              
              {image.quality && (
                <div>
                  <h3 className="font-semibold">Quality</h3>
                  <p className="text-muted-foreground capitalize">{image.quality}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold">Credits Used</h3>
                <p className="text-muted-foreground">{image.creditUsed}</p>
              </div>

              <div>
                <h3 className="font-semibold">Created</h3>
                <p className="text-muted-foreground">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

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
      </DialogContent>
    </Dialog>
  );
}

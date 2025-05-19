import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface ImageProps extends Omit<NextImageProps, 'alt'> {
  alt?: string;
}

export function Image({ className, alt = '', ...props }: ImageProps) {
  return (
    <NextImage
      className={cn('object-cover', className)}
      alt={alt}
      {...props}
    />
  );
} 
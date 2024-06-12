import { ReactNode } from 'react';
import type { Cache } from './cache';

export interface FilejetProps {
  /**
   * Filejet domain.
   *
   * @example 'cdn.filejet.io'
   */
  readonly domain: string;

  /**
   * Img component configuration.
   */
  readonly Img: {
    /**
     * The DPI scale to use for the image.
     *
     * @example [1, 1.5, 2]
     */
    readonly dpiScale: number[];

    /**
     * React node to render while the image and thumbhash is not available.
     */
    readonly placeholderNode: ReactNode;

    /**
     * React node to render when the image cannot be loaded.
     */
    readonly errorNode: ReactNode;
  };

  /**
   * ThumbhashImg component configuration.
   */
  readonly ThumbhashImg: {
    /**
     * Cache for thumbhash images.
     */
    readonly cache: Cache<string, string>;

    /**
     * The root margin for the intersection observer in pixels.
     */
    readonly intersectRootMargin: number;
  };
}

export class Filejet {
  readonly config: FilejetProps;

  constructor(props: FilejetProps) {
    this.config = props;
  }
}

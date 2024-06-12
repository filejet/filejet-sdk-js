import React, { HTMLAttributes, memo, useCallback, useMemo, useRef, useState } from 'react';
import { thumbHashToApproximateAspectRatio } from 'thumbhash';
import { ImgObjectFit, filejetImg } from '../filejetImg';
import { useFilejet } from './provider';
import { ThumbhashImg, useParsedThumbhash } from './thumbhash';

export type ImgPriority = 'high' | 'low' | 'auto';

export interface ImgProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Either the Filejet file ID or URL to the external image.
   */
  readonly src: string;

  /**
   * The width of the image to render.
   */
  readonly width?: number;

  /**
   * The height of the image to render.
   */
  readonly height?: number;

  /**
   * Specifies how to resize the image to fit the specified width/height.
   *
   * - `contain` - The image is resized to fit within the specified dimensions.
   * - `cover` - The image is resized to cover the specified dimensions.
   */
  readonly fit: ImgObjectFit;

  /**
   * Additional mutation to apply to the image.
   *
   * Image is ALWAYS auto-resized to the specified width and height by default.
   */
  readonly mutation?: string;

  /**
   * Simplified base64 encoded representation of the image.
   *
   * This is used to display a low-quality image while
   * the full-quality image is being fetched or
   * when there is an error during loading.
   */
  readonly thumbhash?: string;

  /**
   * Fetch/decode priority for the image.
   *
   * In rare cases, you might want to prioritize some images over others.
   *
   * Recommended value is `auto`.
   *
   * @default 'auto'
   */
  readonly priority?: ImgPriority;

  /**
   * Alt text for the image.
   */
  readonly alt: string;
}

/**
 * Image component that fetches images from/through the Filejet.
 */
export const Img = memo((props: ImgProps) => {
  const { config } = useFilejet();
  const thumbhash = useParsedThumbhash(props.thumbhash);

  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const loadingFailed = useRef(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const { width, height } = useMemo(() => {
    if (props.width != null && props.height != null) {
      return { width: props.width, height: props.height };
    }

    if (props.width != null && thumbhash != null) {
      const ratio = thumbHashToApproximateAspectRatio(thumbhash.data);
      return { width: props.width, height: Math.round(props.width / ratio) };
    }

    if (props.height != null && thumbhash != null) {
      const ratio = thumbHashToApproximateAspectRatio(thumbhash.data);
      return { width: Math.round(props.height * ratio), height: props.height };
    }

    return { width: props.width, height: props.height };
  }, [props.width, props.height, thumbhash]);

  const { src, srcSet } = useMemo(() => {
    return filejetImg({
      src: props.src,
      width,
      height,
      dpiScale: config.Img.dpiScale,
      fit: props.fit,
      backgroundColor: 'transparent',
      mutation: props.mutation,
      filejetDomain: config.domain
    });
  }, [props.src, width, height, props.fit, props.mutation]);

  const htmlProps = useMemo(() => {
    const {
      src: _1,
      width: _2,
      height: _3,
      mutation: _4,
      thumbhash: _5,
      priority: _6,
      alt: _7,
      ...htmlProps
    } = props;
    return htmlProps;
  }, [props]);

  const shouldRenderThumbhash = useCallback(() => {
    return imgRef.current == null || !imgRef.current.complete || loadingFailed.current;
  }, []);

  return (
    <div
      aria-label={props.alt}
      {...htmlProps}
      style={{ ...htmlProps.style, position: 'relative', width, height }}
    >
      {loadingState !== 'error' && (
        // <img /> needs to be rendered first to ensure thumbhash is
        // not rendered when the image is already loaded from cache.
        <img
          src={src}
          srcSet={srcSet}
          loading={props.priority === 'high' ? 'eager' : 'lazy'}
          // We can decode the image in the next frame when thumbhash is provided.
          decoding={props.priority === 'high' ? 'sync' : thumbhash != null ? 'async' : 'auto'}
          fetchpriority={props.priority}
          onLoad={async elm => {
            // Hide placeholders after the image is decoded.
            await elm.currentTarget.decode();
            setLoadingState('loaded');
          }}
          onError={() => {
            loadingFailed.current = true;
            setLoadingState('error');
          }}
          style={{
            position: 'absolute',
            width,
            height,
            objectFit: props.fit,
            textIndent: '-10000px', // Hide loading errors.
            zIndex: 1 // Ensure image is on top of any other nodes.
          }}
          alt="" // We use parent's aria-label instead.
          ref={imgRef}
        />
      )}

      {loadingState !== 'loaded' && thumbhash != null && (
        <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
          <ThumbhashImg
            thumbhash={thumbhash}
            width={width}
            height={height}
            fit={props.fit}
            priority={props.priority ?? 'auto'}
            shouldRender={shouldRenderThumbhash}
          />
        </div>
      )}

      {loadingState !== 'loaded' && thumbhash == null && (
        <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
          {config.Img.placeholderNode}
        </div>
      )}

      {loadingState === 'error' && (
        <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
          {config.Img.errorNode}
        </div>
      )}
    </div>
  );
});

declare module 'react' {
  interface HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

import React, {
  HTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { thumbHashToApproximateAspectRatio } from 'thumbhash';
import { ImgObjectFit, filejetImg } from '../filejetImg';
import { Percentage } from '../helpers';
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
  readonly width?: number | Percentage;

  /**
   * The height of the image to render.
   */
  readonly height?: number | Percentage;

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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSizes, setWrapperSizes] = useState<{ width?: number; height?: number }>({
    width: undefined,
    height: undefined
  });
  const isPercentage = {
    width: typeof props.width === 'string' && props.width.endsWith('%'),
    height: typeof props.height === 'string' && props.height.endsWith('%')
  };

  const { width, height } = useMemo(() => {
    const numericWidth =
      typeof props.width === 'number' && !isPercentage.width ? props.width : wrapperSizes.width;
    const numericHeight =
      typeof props.height === 'number' && !isPercentage.height ? props.height : wrapperSizes.height;

    if (numericWidth != null && numericHeight != null) {
      return { width: numericWidth, height: numericHeight };
    }

    if (numericWidth != null && thumbhash != null) {
      const ratio = thumbHashToApproximateAspectRatio(thumbhash.data);
      return { width: numericWidth, height: Math.round(numericWidth / ratio) };
    }

    if (numericHeight != null && thumbhash != null) {
      const ratio = thumbHashToApproximateAspectRatio(thumbhash.data);
      return { width: Math.round(numericHeight * ratio), height: numericHeight };
    }

    return { width: numericWidth, height: numericHeight };
  }, [props.width, props.height, thumbhash, wrapperSizes.width, wrapperSizes.height]);

  const { src, srcSet } = useMemo(() => {
    return filejetImg({
      src: props.src,
      width,
      height,
      dpiScale: config.Img.dpiScale,
      fit: props.fit,
      backgroundColor: 'transparent',
      mutation: props.mutation,
      filejetDomain: config.domain,
      otherFilejetDomains: config.otherFilejetDomains
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

  useEffect(() => {
    if (wrapperRef.current == null) return;

    if (isPercentage.width && isPercentage.height) {
      setWrapperSizes({
        width: wrapperRef.current.clientWidth,
        height: wrapperRef.current.clientHeight
      });
    }

    if (isPercentage.width && !isPercentage.height) {
      setWrapperSizes({ ...wrapperSizes, width: wrapperRef.current.clientWidth });
    }

    if (!isPercentage.width && isPercentage.height) {
      setWrapperSizes({ ...wrapperSizes, height: wrapperRef.current.clientHeight });
    }
  }, []);

  useEffect(() => {
    if (imgRef.current == null || width == null || height == null) return;

    const observer =
      isPercentage.width || isPercentage.height
        ? new ResizeObserver(entries => {
            for (let entry of entries) {
              const { inlineSize: newWidth } = entry.contentBoxSize[0];
              const { blockSize: newHeight } = entry.contentBoxSize[0];

              if (
                isPercentage.width &&
                isPercentage.height &&
                (newWidth > 1.5 * width || newWidth < 0.75 * width)
              ) {
                setWrapperSizes({ width: newWidth, height: newHeight });
              }
              if (
                isPercentage.width &&
                !isPercentage.height &&
                (newWidth > 1.5 * width || newWidth < 0.75 * width)
              ) {
                setWrapperSizes({ ...wrapperSizes, width: newWidth });
              }
              if (
                !isPercentage.width &&
                isPercentage.height &&
                (newHeight > 1.5 * height || newHeight < 0.75 * height)
              ) {
                setWrapperSizes({ ...wrapperSizes, height: newHeight });
              }
            }
          })
        : undefined;

    observer?.observe(imgRef.current);

    return () => observer?.disconnect();
  }, [width, height]);

  return (
    <div
      aria-label={props.alt}
      {...htmlProps}
      style={{
        ...htmlProps.style,
        position: 'relative',
        width: isPercentage.width ? props.width : width,
        height: isPercentage.height ? props.height : height
      }}
      ref={wrapperRef}
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
            width: isPercentage.width ? '100%' : width,
            height: isPercentage.height ? '100%' : height,
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
            width={isPercentage.width ? '100%' : width}
            height={isPercentage.height ? '100%' : height}
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

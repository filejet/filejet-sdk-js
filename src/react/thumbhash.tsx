import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { thumbHashToAverageRGBA, thumbHashToDataURL } from 'thumbhash';
import type { ImgObjectFit } from '../filejetImg';
import { base64UrlDecode, Percentage } from '../helpers';
import type { ImgPriority } from './img';
import { useFilejet } from './provider';

export interface ParsedThumbhash {
  readonly id: string;
  readonly data: Uint8Array;
}

/**
 * Parses the thumbhash string into a more usable format.
 *
 * Returned data is cached.
 */
export function useParsedThumbhash(thumbhash: string | undefined): ParsedThumbhash | undefined {
  return useMemo(() => {
    if (thumbhash == null) return;
    return {
      id: thumbhash,
      data: Uint8Array.from(base64UrlDecode(thumbhash), c => c.charCodeAt(0))
    };
  }, [thumbhash]);
}

export interface ThumbhashImgProps {
  readonly thumbhash: ParsedThumbhash;
  readonly width: number | Percentage | undefined;
  readonly height: number | Percentage | undefined;
  readonly fit: ImgObjectFit;
  readonly priority: ImgPriority;

  /**
   * Whether a thumbhash should actually be rendered.
   */
  readonly shouldRender: () => boolean;
}

/**
 * Renders a blurred image from thumbhash.
 *
 * Often used as a placeholder while the full-quality image is being fetched.
 */
export const ThumbhashImg = memo((props: ThumbhashImgProps) => {
  const { config } = useFilejet();

  const [src, setSrc] = useState<string | undefined>(() => {
    return props.thumbhash != null ? config.ThumbhashImg.cache.get(props.thumbhash.id) : undefined;
  });

  const decodingRequested = useRef(false);

  const intersectionObserver = useRef<IntersectionObserver | undefined>(undefined);
  useEffect(() => {
    return () => intersectionObserver.current?.disconnect();
  }, []);

  // Ultra fast average color calculation from thumbhash.
  const averageColor = useMemo(() => {
    const { r, g, b, a } = thumbHashToAverageRGBA(props.thumbhash.data);
    const { round } = Math;
    return `rgba(${round(255 * r)},${round(255 * g)},${round(255 * b)},${a})`;
  }, [props.thumbhash]);

  return (
    <img
      src={src}
      decoding={props.priority === 'low' ? 'async' : 'sync'}
      loading={props.priority === 'low' ? 'lazy' : 'eager'}
      style={{
        width: props.width,
        height: props.height,
        objectFit: props.fit,
        backgroundColor: averageColor
      }}
      ref={elm => {
        if (elm == null) return;

        // Skip if thumbhash is already decoded.
        if (src != null) return;

        // Skip if we already tried to decode the thumbhash.
        if (decodingRequested.current) return;
        decodingRequested.current = true;

        requestAnimationFrame(() => {
          if (!props.shouldRender()) return;

          if (props.priority !== 'low') {
            if (isInViewport(elm, config.ThumbhashImg.intersectRootMargin)) {
              decode();
              return;
            }
          }

          intersectionObserver.current = new IntersectionObserver(
            entries => {
              if (entries.length === 0 || !entries[0].isIntersecting) return;

              const tryDecode =
                props.priority === 'low'
                  ? requestIdleCallback || requestAnimationFrame
                  : (fn: any) => fn();

              tryDecode(() => {
                if (!props.shouldRender()) return;
                decode();
              });

              intersectionObserver.current?.disconnect();
              intersectionObserver.current = undefined;
            },
            { rootMargin: `${config.ThumbhashImg.intersectRootMargin}px` }
          );
          intersectionObserver.current.observe(elm);

          function decode() {
            const cachedSrc = config.ThumbhashImg.cache.get(props.thumbhash.id);
            if (cachedSrc == null) {
              const src = thumbHashToDataURL(props.thumbhash.data);
              elm!.src = src; // Do not wait for React - set the src directly.
              setSrc(src);
              config.ThumbhashImg.cache.set(props.thumbhash.id, src);
            } else {
              setSrc(cachedSrc);
            }
          }
        });
      }}
    />
  );
});

function isInViewport(element: HTMLElement, rootMargin: number) {
  const rect = element.getBoundingClientRect();

  const intersectingX = rect.left <= window.innerWidth + rootMargin && rect.right >= 0 - rootMargin;

  const intersectingY =
    rect.top <= window.innerHeight + rootMargin && rect.bottom >= 0 - rootMargin;

  return intersectingX && intersectingY;
}

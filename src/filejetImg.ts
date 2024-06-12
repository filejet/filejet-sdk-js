import { assertUnreachable, base64UrlEncode, isNotNil } from './helpers';

export type ImgObjectFit = 'contain' | 'cover';

export interface FilejetImgProps {
  /**
   * Either the Filejet file ID or URL to the external image.
   */
  readonly src: string;

  /**
   * The width of the image to render.
   */
  readonly width: number | undefined;

  /**
   * The height of the image to render.
   */
  readonly height: number | undefined;

  /**
   * The DPI scale to use for the image.
   *
   * @example [1, 1.5, 2]
   */
  readonly dpiScale: number[];

  /**
   * Specifies how to resize the image to fit the specified width/height.
   *
   * - `contain` - The image is resized to fit within the specified dimensions.
   * - `cover` - The image is resized to cover the specified dimensions.
   */
  readonly fit: ImgObjectFit;

  /**
   * Background color to use when resizing the image.
   *
   * @example 'transparent'
   */
  readonly backgroundColor: string;

  /**
   * Additional mutation to apply to the image.
   *
   * Image is ALWAYS auto-resized to the specified width and height by default.
   */
  readonly mutation?: string;

  /**
   * Filejet domain.
   *
   * @example 'cdn.filejet.io'
   */
  readonly filejetDomain: string;
}

export interface HtmlImgProps {
  readonly src: string;
  readonly srcSet: string | undefined;
  readonly width: number | undefined;
  readonly height: number | undefined;
}

/**
 * Returns the optimized props for the `<img />` element.
 */
export function filejetImg(props: FilejetImgProps): HtmlImgProps {
  return {
    src: imgSrc(1),
    srcSet: props.dpiScale.map(scale => `${imgSrc(scale)} ${scale}x`).join(', '),
    width: props.width,
    height: props.height
  };

  function imgSrc(scale: number): string {
    const mutation = combineMutations(
      resize(props.width, props.height, scale, props.fit, props.backgroundColor),
      props.mutation,
      'auto'
    );

    if (['https://', './', '../', '/', '//'].some(prefix => props.src.startsWith(prefix))) {
      const url = new URL(props.src, document.baseURI);
      const externalId = `@ext_${base64UrlEncode(url.href)}`;
      return `https://${props.filejetDomain}/${externalId}/${mutation}`;
    }

    return `https://${props.filejetDomain}/${props.src}/${mutation}`;
  }
}

function resize(
  width: number | undefined,
  height: number | undefined,
  scale: number,
  fit: ImgObjectFit,
  backgroundColor: string
): string | undefined {
  if (width == null && height == null) return;

  const r = Math.round;

  if (fit === 'cover') {
    if (width != null && height != null) {
      return [
        `resize_${r(width * scale)}x${r(height * scale)}min`,
        `fit_${r(width * scale)}x${r(height * scale)}`,
        `bg_${backgroundColor}`
      ].join(',');
    }

    if (width != null) {
      return `resize_${r(width * scale)}min`;
    }

    if (height != null) {
      return `resize_x${r(height * scale)}min`;
    }

    throw new Error('Invalid width or height!');
  }

  if (fit === 'contain') {
    if (width != null && height != null) {
      return `resize_${r(width * scale)}x${r(height * scale)}shrink`;
    }

    if (width != null) {
      return `resize_${r(width * scale)}shrink`;
    }

    if (height != null) {
      return `resize_x${r(height * scale)}shrink`;
    }

    throw new Error('Invalid width or height!');
  }

  assertUnreachable(fit);
}

function combineMutations(...mutations: Array<string | undefined>): string | undefined {
  if (mutations.length === 0) return;
  return mutations
    .filter(isNotNil)
    .map(m => m.trim())
    .join(',');
}

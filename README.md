# Filejet SDK

Filejet SDK

## Installation

```
yarn add @filejet/sdk
```

## Utils

**Generate `<img / >` attributes:**

To generate the correct `src` and `srcSet` attributes for the `<img />` tag, you can use the `filejetImg` function.

It will return urls with the correct mutations to fit your requirements.

```ts
import { filejetImg } from '@filejet/sdk/utils';

const attributes = filejetImg({
  src: 'https://myapp.com/image.jpg', // Either URL or file ID.
  width: 128,
  height: 128,
  dpiScale: [1, 1.5, 2],
  fit: 'cover',
  backgroundColor: 'transparent',
  filejetDomain: 'cdn.myapp.com',
});

// {
//   src: '...',
//   srcSet: '...',
//   width: 128,
//   height: 128
// }
}
console.log(attributes);
```

## React

To use the Filejet integration, you need to initialize the Filejet and
provide it through the `<FilejetProvider />`.

```tsx
import { Filejet, FilejetProvider, LruCache } from '@filejet/sdk/react';

const filejet = new Filejet({
  domain: 'cdn.app.com',
  Img: {
    dpiScale: [1, 1.5, 2],
    placeholderNode: <div style={{ background: '#eeeded', width: '100%', height: '100%' }}></div>,
    errorNode: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          backgroundColor: `rgba(255,255,255, 0.4)`
        }}
      >
        <WarningIcon color="primary" />
        Failed to load
      </div>
    )
  },
  ThumbhashImg: {
    cache: new LruCache({ maxSize: 512 }),
    intersectRootMargin: 100
  }
});

ReactDOM.render(
  <FilejetProvider filejet={filejet}>
    <App />
  </FilejetProvider>,
  document.getElementById('root')
);
```

### Img component

`<Img>` component will render the image in the most optimized way.

`src` property can be either a filejet ID or HTTPs URL to external file.

```tsx
import { Img } from '@filejet/sdk/react';

<Img
  src="KRhBC0tycdeENyP1PQkgBA"
  thumbhash="HBkSHYSIeHiPiHh8eJd4eTN0EEQG"
  height={168}
  fit="cover"
  alt="Photo"
/>;
```

**Recommended usage:**

It is recommended to alway use `thumbhash` in a combination with `height` to ensure dimensions are known before the image is loaded to prevent layout shift.

Thumbhash encodes both the blurred placeholder and its ratio, so client can avoid layout shifts even when the ratio is not known as it can be calculated from the thumbhash.

**Rendering process:**
Image starts with the single-color placeholder calculated from the average color of thumbhash. Then, when the image is in the viewport, the original image is fetched (scaled based on DPI). If the image is in browser's cache, it is rendered immediately. If not, the blurred placeholder is rendered until the image is loaded.

**Rendering priority:**
`priority` prop can be used to prioritize the image fetching, decoding and blurred placeholder rendering. Recommended value is `auto` (default). Using `low` will lead into longer time between the single-color placeholder and the real image.

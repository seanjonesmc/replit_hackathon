import { BRAND } from '@brand/brand.config';
import { brandAsset } from './primitives';

/**
 * The BRAND background image behind the phone-width screen, faded over the
 * plain surface by BRAND.backgroundImageOpacity. It is a fixed layer the width
 * of the column and the height of the viewport, so it stays put while content
 * scrolls and covers short and tall screens without tiling. The parent column
 * must be `relative isolate` so this sits behind the content but above the
 * desktop surround.
 */
export function ScreenBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-1/2 -z-10 w-full max-w-phone -translate-x-1/2 bg-surface"
      data-testid="shell-backdrop"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${brandAsset(BRAND.backgroundImage)}")`, opacity: BRAND.backgroundImageOpacity }}
        data-testid="shell-backdrop-image"
      />
    </div>
  );
}

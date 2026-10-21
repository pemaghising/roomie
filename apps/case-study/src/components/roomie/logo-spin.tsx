// The nav always shows the original brand mascot; the scroll turntable was removed on request.
export function LogoSpin() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img className="brand-static" src="/assets/brand/mascot.png" alt="" />
    </span>
  );
}
